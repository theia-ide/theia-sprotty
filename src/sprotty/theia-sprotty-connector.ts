/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { QuickPickService } from '@theia/core/lib/browser';
import URI from "@theia/core/lib/common/uri";
import { EditorManager } from '@theia/editor/lib/browser';
import { ILanguageClient, LanguageClientContribution, Location, NotificationType } from '@theia/languages/lib/browser';
import { ActionMessage, ExportSvgAction, ServerStatusAction } from 'sprotty/lib';
import { DiagramWidgetRegistry } from '../theia/diagram-widget-registry';
import { IWorkspaceEditApplicator } from '../theia/languageserver/workspace-edit-applicator';
import { TheiaDiagramServer } from './theia-diagram-server';
import { TheiaFileSaver } from './theia-file-saver';

export interface OpenInTextEditorMessage {
    location: Location
    forceOpen: boolean
}

const acceptMessageType = new NotificationType<ActionMessage, void>('diagram/accept')
const didCloseMessageType = new NotificationType<string, void>('diagram/didClose')
const openInTextEditorMessageType = new NotificationType<OpenInTextEditorMessage, void>('diagram/openInTextEditor')

/**
 * Connects sprotty DiagramServers to a Theia LanguageClientContribution.
 *
 * Used to tunnel sprotty actions to and from the sprotty server through
 * the LSP.
 *
 * Instances bridge the gap between the sprotty DI containers (one per
 * diagram) and a specific language client from the Theia DI container
 * (one per application).
 */
export class TheiaSprottyConnector {

    private servers: TheiaDiagramServer[] = []

    constructor(readonly languageClientContribution: LanguageClientContribution,
                readonly fileSaver: TheiaFileSaver,
                readonly editorManager: EditorManager,
                readonly diagramWidgetRegistry: DiagramWidgetRegistry,
                readonly workspaceEditApplicator?: IWorkspaceEditApplicator,
                readonly quickPickService?: QuickPickService) {
        this.languageClientContribution.languageClient.then(
            lc => {
                lc.onNotification(acceptMessageType, this.receivedThroughLsp.bind(this))
                lc.onNotification(openInTextEditorMessageType, this.openInTextEditor.bind(this))
            }
        ).catch(
            err => console.error(err)
        )
    }

    connect(diagramServer: TheiaDiagramServer) {
        this.servers.push(diagramServer)
        diagramServer.connect(this)
    }

    disconnect(diagramServer: TheiaDiagramServer) {
        const index = this.servers.indexOf(diagramServer)
        if (index >= 0)
            this.servers.splice(index, 0)
        diagramServer.disconnect()
        this.languageClientContribution.languageClient.then(lc => lc.sendNotification(didCloseMessageType, diagramServer.clientId))
    }

    save(uri: string, action: ExportSvgAction) {
        this.fileSaver.save(uri, action)
    }

    openInTextEditor(message: OpenInTextEditorMessage) {
        const uri = new URI(message.location.uri)
        if (!message.forceOpen) {
            this.editorManager.all.forEach(editorWidget => {
                const currentTextEditor = editorWidget.editor
                if (editorWidget.isVisible && uri.toString(true) === currentTextEditor.uri.toString(true)) {
                    currentTextEditor.cursor = message.location.range.start
                    currentTextEditor.revealRange(message.location.range)
                    currentTextEditor.selection = message.location.range
                }
            })
        } else {
            this.editorManager.open(uri).then(
                editorWidget => {
                    const editor = editorWidget.editor
                    editor.cursor = message.location.range.start
                    editor.revealRange(message.location.range)
                    editor.selection = message.location.range
                })
        }
    }

    showStatus(widgetId: string, status: ServerStatusAction): void {
        const widget = this.diagramWidgetRegistry.getWidgetById(widgetId)
        if (widget)
            widget.setStatus(status)
    }

    sendThroughLsp(message: ActionMessage) {
        this.languageClientContribution.languageClient.then(lc => lc.sendNotification(acceptMessageType, message))
    }

    getLanguageClient(): Promise<ILanguageClient> {
        return this.languageClientContribution.languageClient
    }

    receivedThroughLsp(message: ActionMessage) {
        this.servers.forEach(element => {
            element.messageReceived(message)
        })
    }
}

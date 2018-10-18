/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { TheiaSprottyConnector } from '../sprotty/theia-sprotty-connector'
import { injectable, inject } from "inversify"
import { OpenerOptions, OpenHandler, FrontendApplicationContribution, ApplicationShell, WidgetOpenHandler } from "@theia/core/lib/browser"
import URI from "@theia/core/lib/common/uri"
import { DiagramWidget, DiagramWidgetOptions } from "./diagram-widget"
import { DiagramWidgetRegistry } from "./diagram-widget-registry"
import { Emitter, Event, SelectionService } from '@theia/core/lib/common'
import { EditorManager } from '@theia/editor/lib/browser';
import { TheiaDiagramServer } from '../sprotty/theia-diagram-server';

export const DiagramManagerProvider = Symbol('DiagramManagerProvider')

export type DiagramManagerProvider = () => Promise<DiagramManager>

export interface DiagramManager extends OpenHandler, FrontendApplicationContribution {
    readonly diagramType: string
    readonly onDiagramOpened: Event<URI>
    diagramConnector: TheiaSprottyConnector | undefined
}

@injectable()
export abstract class DiagramManagerImpl extends WidgetOpenHandler<DiagramWidget> implements DiagramManager {

    @inject(ApplicationShell) protected readonly shell: ApplicationShell;
    @inject(DiagramWidgetRegistry) protected readonly widgetRegistry: DiagramWidgetRegistry;
    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(EditorManager) protected editorManager: EditorManager;

    protected readonly onDiagramOpenedEmitter = new Emitter<URI>()

    abstract get diagramType(): string
    abstract iconClass: string

    get id() {
        return this.diagramType + "-diagram-opener"
    }

    get onDiagramOpened(): Event<URI> {
        return this.onDiagramOpenedEmitter.event
    }

    canHandle(uri: URI, options?: OpenerOptions | undefined): number {
        return 10
    }

    open(uri: URI, input?: OpenerOptions): Promise<DiagramWidget> {
        const promiseDiagramWidget = this.getOrCreateDiagramWidget(uri)
        promiseDiagramWidget.then(diagramWidget => {
            window.requestAnimationFrame(() => {
                this.shell.activateWidget(diagramWidget.id)
                this.onDiagramOpenedEmitter.fire(uri)
            })
        })
        return promiseDiagramWidget
    }

    protected async getOrCreateDiagramWidget(uri: URI): Promise<DiagramWidget> {
        const widget = await this.widgetRegistry.getWidget(uri, this.diagramType);
        if (widget !== undefined)
            return widget
        const newWidget = await this.createDiagramWidget(uri)
        const modelSource = newWidget.modelSource;
        if (modelSource instanceof TheiaDiagramServer && this.diagramConnector) {
            this.diagramConnector.connect(modelSource);
        }
        newWidget.disposed.connect(() => {
            this.widgetRegistry.removeWidget(newWidget.uri, newWidget.diagramType)
            if (modelSource instanceof TheiaDiagramServer && this.diagramConnector)
                this.diagramConnector.disconnect(modelSource)
        })
        this.addToShell(newWidget)
        return Promise.resolve(newWidget)
    }

    protected async createDiagramWidget(uri: URI): Promise<DiagramWidget> {
        const newWidget = await this.getOrCreateWidget(uri);
        newWidget.title.closable = true
        newWidget.title.label = uri.path.base
        newWidget.title.icon = this.iconClass
        this.widgetRegistry.addWidget(uri, this.diagramType, newWidget)
        return newWidget
    }

    protected createWidgetOptions(uri: URI): DiagramWidgetOptions {
        const id = this.widgetRegistry.nextId()
        const svgContainerId = id + '_sprotty'
        return {
            id, svgContainerId, uri: uri.toString(), diagramType: this.diagramType
        }
    }

    protected addToShell(widget: DiagramWidget): void {
        const currentEditor = this.editorManager.currentEditor
        const options: ApplicationShell.WidgetOptions = {
            area: 'main'
        }
        if (!!currentEditor && currentEditor.editor.uri.toString(true) === widget.uri.toString(true)) {
            options.ref = currentEditor
            options.mode = 'split-right'
        }
        this.shell.addWidget(widget, options)
    }

    get diagramConnector(): TheiaSprottyConnector | undefined {
        return undefined
    }
}

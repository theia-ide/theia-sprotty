/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable, optional } from "inversify";
import { Action, ActionHandlerRegistry, ActionMessage, DiagramServer, ExportSvgAction, IActionDispatcher,
    ICommand, ILogger, RequestModelAction, RequestPopupModelAction, SelectCommand, ServerStatusAction,
    SetPopupModelAction, SModelElementSchema, SModelRootSchema, SModelStorage, TYPES, ViewerOptions } from 'sprotty/lib';
import { TheiaSprottyConnector } from './theia-sprotty-connector';
import { IWorkspaceEditApplicator } from "../theia/languageserver/workspace-edit-applicator";


export const TheiaDiagramServerProvider = Symbol('TheiaDiagramServerProvider');

export type TheiaDiagramServerProvider = () => Promise<TheiaDiagramServer>;

export const IRootPopupModelProvider = Symbol('IRootPopupModelProvider');
export interface IRootPopupModelProvider {
    getPopupModel(action: RequestPopupModelAction, rootElement: SModelRootSchema): Promise<SModelElementSchema | undefined>;
}

/**
 * A sprotty DiagramServer that can be connected to a Theia language
 * server.
 *
 * This class is the sprotty side of the Theia/sprotty integration. It
 * is instantiated with the DI container of the sprotty diagram. Theia
 * services are available via the TheiaDiagramServerConnector.
 */
@injectable()
export class TheiaDiagramServer extends DiagramServer {

    private connector: Promise<TheiaSprottyConnector>
    private resolveConnector: (server: TheiaSprottyConnector) => void
    protected sourceUri: string
    protected workspaceEditApplicator: IWorkspaceEditApplicator | undefined;

    @inject(IRootPopupModelProvider)@optional() protected rootPopupModelProvider: IRootPopupModelProvider;

    constructor(@inject(TYPES.IActionDispatcher) public actionDispatcher: IActionDispatcher,
                @inject(TYPES.ActionHandlerRegistry) actionHandlerRegistry: ActionHandlerRegistry,
                @inject(TYPES.ViewerOptions) viewerOptions: ViewerOptions,
                @inject(TYPES.SModelStorage) storage: SModelStorage,
                @inject(TYPES.ILogger) logger: ILogger) {
        super(actionDispatcher, actionHandlerRegistry, viewerOptions, storage, logger)
        this.waitForConnector()
    }

    connect(connector: TheiaSprottyConnector): void {
        this.resolveConnector(connector)
        this.workspaceEditApplicator = connector.workspaceEditApplicator
    }

    disconnect(): void {
        this.waitForConnector()
    }

    private waitForConnector(): void {
        this.connector = new Promise<TheiaSprottyConnector>(resolve =>
            this.resolveConnector = resolve)
    }

    getConnector() {
        return this.connector
    }

    getSourceUri() {
        return this.sourceUri
    }

    getWorkspaceEditApplicator() {
        return this.workspaceEditApplicator
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry)
        registry.register(SelectCommand.KIND, this)
    }

    handle(action: Action): void | ICommand {
        if (action instanceof RequestModelAction && action.options !== undefined)
            this.sourceUri = action.options.sourceUri
        return super.handle(action)
    }

    handleLocally(action: Action): boolean {
        if (action instanceof RequestPopupModelAction) {
            return this.handleRequestPopupModel(action);
        } else {
            return super.handleLocally(action);
        }
    }

    handleExportSvgAction(action: ExportSvgAction): boolean {
        this.connector.then(c => c.save(this.sourceUri, action))
        return true
    }

    handleRequestPopupModel(action: RequestPopupModelAction): boolean {
        if (action.elementId === this.currentRoot.id) {
            this.rootPopupModelProvider.getPopupModel(action, this.currentRoot).then(model => {
                if (model)
                    this.actionDispatcher.dispatch(new SetPopupModelAction(model));
            });
            return false;
        } else {
            return true;
        }
    }

    protected handleServerStateAction(status: ServerStatusAction): boolean {
        this.connector.then(c => c.showStatus(this.clientId, status))
        return false
    }

    sendMessage(message: ActionMessage) {
        this.connector.then(c => c.sendThroughLsp(message))
    }

    /**
     * made public
     */
    messageReceived(message: ActionMessage) {
        super.messageReceived(message)
    }
}



/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { TYPES, DiagramServer, RequestModelAction, CenterAction, InitializeCanvasBoundsAction, ModelSource, ServerStatusAction, IActionDispatcher } from 'sprotty/lib';
import { Widget } from "@phosphor/widgets"
import { Message } from "@phosphor/messaging/lib"
import URI from "@theia/core/lib/common/uri"
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget'
import { StatefulWidget } from '@theia/core/lib/browser';
import { DiagramConfigurationRegistry } from './diagram-configuration';
import { TheiaDiagramServer } from '../sprotty/theia-diagram-server';
import { DiagramManagerImpl } from './diagram-manager';
import { DiagramWidgetRegistry } from './diagram-widget-registry';

export interface DiagramWidgetOptions {
    id: string
    svgContainerId: string
    uri: string
    diagramType: string
}

export class DiagramWidget extends BaseWidget implements StatefulWidget {

    private statusIconDiv: HTMLDivElement
    private statusMessageDiv: HTMLDivElement

    protected _id: string;
    protected _svgContainerId: string
    protected _uri: URI
    protected _diagramType: string
    protected _modelSource: ModelSource
    protected _actionDispatcher: IActionDispatcher

    constructor(
        protected options: DiagramWidgetOptions,
        protected diagramConfigurationRegistry: DiagramConfigurationRegistry,
        protected diagramManager: DiagramManagerImpl,
        protected widgetRegistry: DiagramWidgetRegistry) {
        super()

        this.initialize();
    }

    get id(): string {
        return this._id;
    }

    get svgContainerId(): string {
        return this._svgContainerId;
    }

    get uri(): URI {
        return this._uri;
    }

    get diagramType(): string {
        return this._diagramType;
    }

    get modelSource(): ModelSource {
        return this._modelSource;
    }

    get actionDispatcher(): IActionDispatcher {
        return this._actionDispatcher;
    }

    protected initialize() {
        this._id = this.options.id
        this._svgContainerId = this.options.svgContainerId
        this._uri = new URI(this.options.uri)
        this._diagramType = this.options.diagramType
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg)
        const svgContainer = document.createElement("div")
        svgContainer.id = this._svgContainerId
        this.node.appendChild(svgContainer)

        const statusDiv = document.createElement("div")
        statusDiv.setAttribute('class', 'sprotty-status')
        this.node.appendChild(statusDiv)

        this.statusIconDiv = document.createElement("div")
        this.statusIconDiv.setAttribute('class', 'fa')
        statusDiv.appendChild(this.statusIconDiv)

        this.statusMessageDiv = document.createElement("div")
        this.statusMessageDiv.setAttribute('class', 'sprotty-status-message')
        statusDiv.appendChild(this.statusMessageDiv)

        const diagramConfiguration = this.diagramConfigurationRegistry.get(this.options.diagramType);
        const diContainer = diagramConfiguration.createContainer(this.options.svgContainerId);
        const modelSource = diContainer.get<ModelSource>(TYPES.ModelSource);
        if (modelSource instanceof DiagramServer) {
            modelSource.clientId = this.options.id;
        }

        this._modelSource = modelSource;
        this._actionDispatcher = diContainer.get<IActionDispatcher>(TYPES.IActionDispatcher);

        if (modelSource instanceof TheiaDiagramServer && this.diagramManager.diagramConnector) {
            this.diagramManager.diagramConnector.connect(modelSource);
        }

        this.disposed.connect(() => {
            this.widgetRegistry.removeWidget(this.uri, this.diagramType);
            if (modelSource instanceof TheiaDiagramServer && this.diagramManager.diagramConnector)
                this.diagramManager.diagramConnector.disconnect(modelSource);
        });

        this._modelSource.handle(new RequestModelAction({
            sourceUri: this._uri.toString(true),
            diagramType: this._diagramType
        }))
    }

    protected getBoundsInPage(element: Element) {
        const bounds = element.getBoundingClientRect()
        return {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height
        }
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg)
        const newBounds = this.getBoundsInPage(this.node as Element)
        this._actionDispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds))
        this._actionDispatcher.dispatch(new CenterAction([], false))
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg)
        const svgElement = this.node.querySelector(`#${this._svgContainerId} svg`) as HTMLElement
        if (svgElement !== null)
            svgElement.focus()
    }

    storeState(): object {
        const {label, iconClass} = this.title;
        return {
            options: this.options,
            label,
            iconClass
        }
    }
    restoreState(oldState: object): void {
        const {options, label, iconClass} = oldState as any;
        this.options = options;
        this.title.label = label;
        this.title.iconClass = iconClass;
        this.initialize();
    }

    setStatus(status: ServerStatusAction): void {
        this.statusMessageDiv.textContent = status.message
        this.removeClasses(this.statusMessageDiv, 1)
        this.statusMessageDiv.classList.add(status.severity.toLowerCase())
        this.removeClasses(this.statusIconDiv, 1)
        const classes = this.statusIconDiv.classList
        classes.add(status.severity.toLowerCase())
        switch (status.severity) {
            case 'ERROR': classes.add('fa-exclamation-circle')
                break
            case 'WARNING': classes.add('fa-warning')
                break
            case 'INFO': classes.add('fa-info-circle')
                break
        }
    }

    protected removeClasses(element: Element, keep: number) {
        const classes = element.classList
        while (classes.length > keep) {
            const item = classes.item(classes.length - 1)
            if (item)
                classes.remove(item)
        }
    }
}
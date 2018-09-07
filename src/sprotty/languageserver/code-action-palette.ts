/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from "inversify";
import { Action, EMPTY_ROOT, HtmlRootSchema, PopupHoverMouseListener, RequestPopupModelAction,
    SButton, SButtonSchema, SetPopupModelAction, SModelElement, SModelElementSchema, SModelRootSchema } from "sprotty/lib";
import { TheiaDiagramServerProvider, IRootPopupModelProvider } from '../theia-diagram-server';
import { toLsRange } from './ranged';
import { CodeAction, CodeActionParams, CodeActionRequest, Range } from 'vscode-languageserver-protocol';
import { WorkspaceEditAction } from "./workspace-edit-command";

@injectable()
export class CodeActionProvider {

    @inject(TheiaDiagramServerProvider) diagramServerProvider: TheiaDiagramServerProvider;

    async getCodeActions(range: Range, codeActionKind: string) {
        const diagramServer = await this.diagramServerProvider();
        const connector = await diagramServer.getConnector();
        const languageClient = await connector.getLanguageClient();
        return await languageClient.sendRequest(CodeActionRequest.type, <CodeActionParams>{
            textDocument: {
                uri: diagramServer.getSourceUri()
            },
            range,
            context: {
                only: [codeActionKind]
            }
        });
    }
}

/**
 * A popup-palette based on code actions.
 */
@injectable()
export class CodeActionPalettePopupProvider implements IRootPopupModelProvider {

    @inject(CodeActionProvider) codeActionProvider: CodeActionProvider;

    async getPopupModel(action: RequestPopupModelAction, rootElement: SModelRootSchema): Promise<SModelElementSchema | undefined> {
        const rangeString: string = (rootElement as any)['range'];
        if (rangeString !== undefined) {
            const range = toLsRange(rangeString);
            const codeActions = await this.codeActionProvider.getCodeActions(range, 'sprotty.create');
            if (codeActions) {
                const buttons: PaletteButtonSchema[] = [];
                codeActions.forEach(codeAction => {
                    if (CodeAction.is(codeAction)) {
                        buttons.push(<PaletteButtonSchema>{
                            id: codeAction.title,
                            type: 'button:create',
                            codeActionKind: codeAction.kind,
                            range
                        });
                    }
                });
                return <HtmlRootSchema>{
                    id: "palette",
                    type: "palette",
                    classes: ['sprotty-palette'],
                    children: buttons,
                    canvasBounds: action.bounds
                };
            }
        }
        return undefined;
    }
}

export interface PaletteButtonSchema extends SButtonSchema {
    codeActionKind: string;
    range: Range;
}

export class PaletteButton extends SButton {
    codeActionKind: string;
    range: Range;
}

@injectable()
export class PaletteMouseListener extends PopupHoverMouseListener {

    @inject(CodeActionProvider) codeActionProvider: CodeActionProvider;
    @inject(TheiaDiagramServerProvider) diagramServerProvider: TheiaDiagramServerProvider;

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (target instanceof PaletteButton) {
            return [this.getWorkspaceEditAction(target)];
        }
        return [];
    }

    async getWorkspaceEditAction(target: PaletteButton): Promise<Action> {
        const diagramServer = await this.diagramServerProvider();
        const workspace = diagramServer.getWorkspace();
        if (workspace) {
            const codeActions = await this.codeActionProvider.getCodeActions(target.range, target.codeActionKind);
            if (codeActions) {
                for (let codeAction of codeActions) {
                    if (CodeAction.is(codeAction) && codeAction.edit)
                        return new WorkspaceEditAction(codeAction.edit, workspace);
                }
            }
        }
        return new SetPopupModelAction(EMPTY_ROOT);
    }
}

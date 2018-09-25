/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { RenameRequest } from '@theia/languages/lib/browser';
import { SingleTextInputDialog } from '@theia/core/lib/browser';
import { inject, injectable } from "inversify";
import { SLabel } from "sprotty/lib";
import { TheiaDiagramServerProvider } from "../theia-diagram-server";
import { Ranged, toLsRange } from "./ranged";

@injectable()
export class RenameLabelEditor {

    @inject(TheiaDiagramServerProvider) diagramServerProvider: TheiaDiagramServerProvider;

    async edit(element: SLabel & Ranged) {
        const range = toLsRange(element.range);
        const diagramServer = await this.diagramServerProvider();
        const connector = await diagramServer.getConnector();
        if (connector.workspace) {
            const initialValue = element.text;
            const dialog = new SingleTextInputDialog({
                title: 'Rename Element',
                initialValue,
                initialSelectionRange: {
                    start: 0,
                    end: element.text.length
                },
                validate: (name, mode) => {
                    if (initialValue === name && mode === 'preview') {
                        return false;
                    }
                    return true;
                }
            });
            const newName = await dialog.open();
            if (newName) {
                const languageClient = await connector.getLanguageClient();
                const workspaceEdit = await languageClient.sendRequest(RenameRequest.type, {
                    textDocument: { uri: diagramServer.getSourceUri() },
                    position: range.start,
                    newName
                })
                if (workspaceEdit) {
                    await connector.workspace.applyEdit(workspaceEdit)
                }
            }
        }
    }
}
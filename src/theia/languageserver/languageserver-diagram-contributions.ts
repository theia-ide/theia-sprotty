/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { CommandContribution, CommandRegistry } from "@theia/core";
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import { DeleteWithWorkspaceEditAction } from "../../sprotty/languageserver/delete";
import { TheiaDiagramServer } from "../../sprotty/theia-diagram-server";
import { DiagramCommandHandler, DiagramCommands } from "../diagram-commands";
import { DiagramKeybindingContext } from "../diagram-keybinding";

@injectable()
export class LSDiagramCommandContribution implements CommandContribution {

    constructor(@inject(ApplicationShell) protected readonly shell: ApplicationShell) {
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: DiagramCommands.DELETE,
            label: 'Delete selected'
        })
        registry.registerHandler(
            DiagramCommands.DELETE,
            new DiagramCommandHandler(this.shell, widget => {
                if (widget.modelSource instanceof TheiaDiagramServer) {
                    const workspaceEditApplicator  = widget.modelSource.getWorkspaceEditApplicator()
                    if (workspaceEditApplicator) {
                        const action = new DeleteWithWorkspaceEditAction(workspaceEditApplicator, widget.modelSource.getSourceUri());
                        widget.actionDispatcher.dispatch(action);
                    }
                }
            })
        );
    }
}

@injectable()
export class LSDiagramKeybindingContribution implements KeybindingContribution {

    constructor(@inject(DiagramKeybindingContext) protected readonly diagramKeybindingContext: DiagramKeybindingContext) {
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: DiagramCommands.DELETE,
            context: this.diagramKeybindingContext.id,
            keybinding: 'del'
        });
        registry.registerKeybinding({
            command: DiagramCommands.DELETE,
            context: this.diagramKeybindingContext.id,
            keybinding: 'backspace'
        });
    }
}

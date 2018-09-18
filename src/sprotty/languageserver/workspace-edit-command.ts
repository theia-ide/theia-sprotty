/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Action, Command, CommandExecutionContext, CommandResult } from "sprotty/lib";
import { Workspace, WorkspaceEdit } from "@theia/languages/lib/browser";

export abstract class AbstractWorkspaceEditCommand extends Command {

    abstract createWorkspaceEdit(context: CommandExecutionContext): WorkspaceEdit
    abstract get workspace(): Workspace

    protected workspaceEdit: WorkspaceEdit | undefined;

    execute(context: CommandExecutionContext): CommandResult {
        this.workspaceEdit = this.createWorkspaceEdit(context)
        this.workspace.applyEdit(this.workspaceEdit);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        // TODO implement revert workspace edit
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        // TODO implement revert workspace edit
        return context.root;
    }
}

export class WorkspaceEditCommand extends AbstractWorkspaceEditCommand {
    static readonly KIND = 'workspaceEdit';

    constructor(readonly action: WorkspaceEditAction) {
        super();
    }

    get workspace() {
        return this.action.workspace;
    }

    createWorkspaceEdit(context: CommandExecutionContext) {
        return this.action.workspaceEdit;
    }
}

/**
 * This is a client only action, so it does not have to be serializable
 */
export class WorkspaceEditAction implements Action {
    readonly kind = WorkspaceEditCommand.KIND;
    constructor(readonly workspaceEdit: WorkspaceEdit, readonly workspace: Workspace) {}
}

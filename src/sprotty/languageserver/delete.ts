/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { TextEdit, Workspace, WorkspaceEdit } from "@theia/languages/lib/browser";
import { Action, CommandExecutionContext, isSelectable, SEdge, Selectable, SModelElement, SModelRoot, SChildElement } from "sprotty/lib";
import { AbstractWorkspaceEditCommand } from "./workspace-edit-command";
import { toLsRange, isRanged, Ranged } from "./ranged";

export class DeleteWithWorkspaceEditCommand extends AbstractWorkspaceEditCommand {
    static readonly KIND = 'deleteWithWorkspaceEdit'

    constructor(readonly action: DeleteWithWorkspaceEditAction) {
        super();
    }

    get workspace() {
        return this.action.workspace;
    }

    createWorkspaceEdit(context: CommandExecutionContext) {
        const elementsToBeDeleted = this.findElementsToBeDeleted(context.root);
        const textEdits: TextEdit[] = [];
        // TODO: consider URIs from element traces
        elementsToBeDeleted.forEach(e => {
            textEdits.push({
                range: toLsRange(e.range),
                newText: ''
            });
        })
        const workspaceEdit: WorkspaceEdit = {
            changes: {
                [this.action.sourceUri]: textEdits
            }
        }
        return workspaceEdit;
    }

    private findElementsToBeDeleted(root: SModelRoot) {
        const elements = new Set<SModelElement & Ranged>();
        const index = root.index;
        index.all().forEach(e => {
            if (e && this.shouldDelete(e))
                elements.add(e);
            else if (e instanceof SEdge && isRanged(e)) {
                const source = index.getById(e.sourceId);
                const target = index.getById(e.targetId);
                if (this.shouldDeleteParent(source)
                    || this.shouldDeleteParent(target))
                    elements.add(e);
            }
        });
        return elements
    }

    private shouldDelete<T extends SModelElement>(e: T): e is (Ranged & Selectable & T) {
        return isSelectable(e) && e.selected && isRanged(e);
    }

    private shouldDeleteParent(source: SModelElement | undefined): boolean {
        while (source) {
            if (this.shouldDelete(source)) {
                return true;
            }
            source = (source instanceof SChildElement) ? source.parent : undefined;
        }
        return false;
    }
}

export class DeleteWithWorkspaceEditAction implements Action {
    readonly kind = DeleteWithWorkspaceEditCommand.KIND

    // TODO: consider URIs from individual element traces
    constructor(readonly workspace: Workspace, readonly sourceUri: string) {}
}


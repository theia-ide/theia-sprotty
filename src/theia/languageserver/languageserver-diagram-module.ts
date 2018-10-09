/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { KeybindingContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common';
import { ContainerModule } from 'inversify';
import { LSDiagramCommandContribution, LSDiagramKeybindingContribution } from './languageserver-diagram-contributions';
import { IWorkspaceEditApplicator, WorkspaceEditApplicator } from './workspace-edit-applicator';

/**
 * Standard DI config for languageserver aware diagrams.
 */
export default new ContainerModule(bind => {
    bind(CommandContribution).to(LSDiagramCommandContribution).inSingletonScope()
    bind(KeybindingContribution).to(LSDiagramKeybindingContribution).inSingletonScope()
    bind(WorkspaceEditApplicator).toSelf().inSingletonScope()
    bind(IWorkspaceEditApplicator).toService(WorkspaceEditApplicator)
})

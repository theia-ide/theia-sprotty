/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { SModelElement } from "sprotty/lib";

export const traceFeature = Symbol("rangedFeature")

export interface Traceable {
    trace: string
}

export function isTraceable<T extends SModelElement>(element: T): element is Traceable & T {
   return element.hasFeature(traceFeature) && (element as any).trace !== null
}
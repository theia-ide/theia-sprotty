/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { SModelElement } from "sprotty/lib";
import { Range } from "@theia/languages/lib/browser";

export interface Ranged {
    range: string
}

export function isRanged<T extends SModelElement>(element: T): element is Ranged & T {
   return (element as any).range !== undefined
}

export function toLsRange(rangeString: string): Range {
    const numbers = rangeString.split(/[:-]/).map(s => parseInt(s, 10));
    return  <Range>{
        start: {
            line: numbers[0],
            character: numbers[1]
        },
        end: {
            line: numbers[2],
            character: numbers[3]
        }
    };
}
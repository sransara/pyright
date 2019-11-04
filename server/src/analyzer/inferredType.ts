/*
* inferredType.ts
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT license.
* Author: Eric Traut
*
* Object that stores multiple types that combine to create
* a single inferred type. Each of the types come from
* different parse nodes, and they can be updated as type
* analysis proceeds.
*/

import { combineTypes, isTypeSame, Type, UnknownType } from './types';

// A type can be inferred from multiple sources. Each sources
// has a type and a unique ID, which remains constant through
// multiple passes of type analysis. As new type information
// becomes known, sources can be updated (e.g. from "unknown"
// to a known type).
export interface InferredTypeSource {
    type: Type;
    sourceId: TypeSourceId;
}

export type TypeSourceId = number;
export const defaultTypeSourceId: TypeSourceId = 0;

export class InferredType {
    private _sources: InferredTypeSource[] = [];
    private _combinedType: Type;

    constructor() {
        this._combinedType = UnknownType.create();
    }

    getType() {
        return this._combinedType;
    }

    getSources() {
        return this._sources;
    }

    // Adds a new source (or replaces an existing source) for the
    // inferred type. Returns true if the combined type changed.
    addSource(type: Type, sourceId: TypeSourceId): boolean {
        // Is this source already known?
        const sourceIndex = this._sources.findIndex(src => src.sourceId === sourceId);
        if (sourceIndex >= 0) {
            if (isTypeSame(this._sources[sourceIndex].type, type)) {
                return false;
            }

            this._sources[sourceIndex] = { sourceId, type };
        } else {
            this._sources.push({ sourceId, type });
        }

        return this._recomputeCombinedType();
    }

    private _recomputeCombinedType(): boolean {
        const sourceTypes = this._sources.map(source => source.type);
        let newCombinedType: Type | undefined;

        if (sourceTypes.length === 0) {
            newCombinedType = UnknownType.create();
        } else {
            newCombinedType = combineTypes(sourceTypes);
        }

        if (!isTypeSame(newCombinedType, this._combinedType)) {
            this._combinedType = newCombinedType;
            return true;
        }

        return false;
    }
}

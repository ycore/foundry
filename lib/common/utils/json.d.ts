interface MergeObject {
    [mergeKey: string]: any;
}
export declare const mergeJSON: (targetJson: MergeObject, ...mergesJson: MergeObject[]) => MergeObject;
export {};

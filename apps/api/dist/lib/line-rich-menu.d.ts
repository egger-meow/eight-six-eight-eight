export declare const lineAdminRichMenuVersion = "admin-v1";
export declare const lineAdminRichMenuName = "86.88 Admin admin-v1";
export declare const lineRichMenuSize: {
    width: number;
    height: number;
};
export type LineRichMenuClient = {
    listRichMenus(): Promise<Array<{
        richMenuId: string;
        name: string;
    }>>;
    createRichMenu(payload: any): Promise<string>;
    deleteRichMenu(richMenuId: string): Promise<void>;
    uploadRichMenuImage(richMenuId: string, image: Buffer, contentType: string): Promise<void>;
    linkRichMenuToUser(userId: string, richMenuId: string): Promise<void>;
    unlinkRichMenuFromUser(userId: string): Promise<void>;
};
export declare function buildAdminRichMenuPayload(): {
    size: {
        width: number;
        height: number;
    };
    selected: boolean;
    name: string;
    chatBarText: string;
    areas: {
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        action: {
            type: string;
            data: string;
        };
    }[];
};
export declare function validateRichMenuTapAreas(payload?: {
    size: {
        width: number;
        height: number;
    };
    selected: boolean;
    name: string;
    chatBarText: string;
    areas: {
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        action: {
            type: string;
            data: string;
        };
    }[];
}): string[];
export declare function syncLineAdminRichMenu(args: {
    client: LineRichMenuClient;
    activeUserIds: string[];
    inactiveUserIds: string[];
    imagePath?: string;
}): Promise<{
    richMenuId: string;
    created: boolean;
    uploadedImage: boolean;
    linked: string[];
    unlinked: string[];
    deletedStale: string[];
    areaCount: number;
}>;
export declare function linkLineAdminRichMenuToUser(userId: string, client?: LineRichMenuClient): Promise<string | null>;
export declare function unlinkLineAdminRichMenuFromUser(userId: string, client?: LineRichMenuClient): Promise<boolean>;
export declare function uniqueValidLineUserIds(values: string[]): string[];
export declare function createLineRichMenuHttpClient(accessToken?: string | undefined): LineRichMenuClient;
export declare function validateRichMenuImage(image: Buffer): void;
//# sourceMappingURL=line-rich-menu.d.ts.map
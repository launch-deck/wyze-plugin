declare module 'wyze-node' {
    class Wyze {
        accessToken?: string;
        baseUrl: string;
        constructor(options: any);
        getRequestBodyData(data: any): any;
        getTokens(): void;
        setTokens(accessToken: string, refreshToken: string): void;
        login(): Promise<any>;
        getRefreshToken(): Promise<any>;
        getObjectList(): Promise<any>;
        runAction(instanceId: string, providerKey: string, actionKey: string): Promise<any>;
        getDeviceInfo(deviceMac: string, deviceModel: string): Promise<any>;
        getPropertyList(deviceMac: string, deviceModel: string): Promise<any>;
        setProperty(deviceMac: string, deviceModel: string, propertyId: string, propertyValue: string): Promise<any>;
        getDeviceList(): Promise<any[]>;
        getDeviceByName(nickname: string): Promise<any>;
        getDeviceByMac(mac: string): Promise<any>;
        getDevicesByType(type: string): Promise<any[]>;
        getDevicesByModel(model: string): Promise<any[]>;
        getDeviceGroupsList(): Promise<any[]>;
        getDeviceSortList(): Promise<any[]>;
        turnOn(device: any): Promise<any>;
        turnOff(device: any): Promise<any>;
        getDeviceStatus(device: any): Promise<any>;
        getDeviceState(device: any): any;
    }
    export = Wyze;
};

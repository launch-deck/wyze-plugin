import axios from 'axios';
import Wyze from "wyze-node";
import type { Command, Plugin } from "@launch-deck/common";

enum CommandType {
    BulbBrightness
}

const WYZE_BULB_MODEL = 'WLPA19C';
const WYZE_PROPERTIES = {
    power: "P3",
    brightness: "P1501",
    color: "P1507"
};

let wyze: Wyze | undefined;

const WyzePlugin: Plugin = {

    async handleCommand(command: Command): Promise<void> {

        if (!wyze) {
            throw "Plugin settings not set";
        }

        const type = command.type as CommandType;

        switch (type) {
            case CommandType.BulbBrightness:

                const deviceMacs = command.data?.device?.split(",") || [];
                const power = command.data?.power;
                const brightness = command.data?.brightness;
                const color = command.data?.color;

                if (deviceMacs != null) {
                    let actions: any[] = [];

                    for (let mac of deviceMacs) {
                        const device = await wyze.getDeviceByMac(mac);

                        if (!device) {
                            continue;
                        }

                        let powerOn = true;
                        if (power?.toLowerCase() === 'true' || power?.toLowerCase() === 'false') {
                            powerOn = power.toLowerCase() === 'true';
                            actions.push(getPowerAction(device, powerOn));
                        }

                        if (powerOn || !power) {
                            if (brightness) {
                                actions.push(getBulbBrightnessAction(device, parseInt(brightness)));
                            }
                            if (color) {
                                actions.push(getBulbColorAction(device, color));
                            }
                        }
                    }

                    if (actions.length > 0) {
                        await runActionList(actions);
                    }
                }

                break;
        }
    },

    async getCommands(): Promise<Command[]> {

        if (!wyze) {
            throw "Plugin settings not set";
        }

        const bulbs: any[] = await wyze.getDevicesByModel(WYZE_BULB_MODEL);

        const commands: Command[] = [
            {
                name: 'Wyze Bulb',
                type: CommandType.BulbBrightness,
                commandInputs: {
                    device: {
                        name: "Bulb",
                        type: 'select',
                        selectionOptions: bulbs.map(device => {
                            return { name: device.nickname, data: device.mac };
                        }),
                        multiple: true
                    },
                    power: {
                        name: 'Power',
                        type: 'select',
                        selectionOptions: [
                            { name: 'On', data: 'true' },
                            { name: 'Off', data: 'false' }
                        ]
                    },
                    brightness: { name: 'Brightness', type: 'number' },
                    color: { name: 'Color', type: 'value' }
                }
            }
        ];

        return commands;
    },

    loadSettings(settings: { [key: string]: string; }): void {
        var username = settings.username;
        var password = settings.password;

        if (username && password) {
            wyze = new Wyze({
                username: username,
                password: password
            });
        }
    },

    getSettingsKeys(): string[] {
        return [
            "username",
            "password"
        ];
    }
}

function getPowerAction(device: any, powerOn: boolean): any {
    return {
        key: 'set_mesh_property',
        prop: WYZE_PROPERTIES.power,
        value: powerOn ? '1' : '0',
        device_mac: device.mac,
        provider_key: device.product_model
    }
}

function getBulbBrightnessAction(device: any, brightness: number): any {
    return {
        key: 'set_mesh_property',
        prop: WYZE_PROPERTIES.brightness,
        value: brightness.toString(),
        device_mac: device.mac,
        provider_key: device.product_model
    }
}

function getBulbColorAction(device: any, color: string): any {
    return {
        key: 'set_mesh_property',
        prop: WYZE_PROPERTIES.color,
        value: color,
        device_mac: device.mac,
        provider_key: device.product_model
    }
}

async function runActionList(actions: any[]): Promise<any> {

    if (!wyze) {
        return;
    }

    let result;
    try {
        wyze.getTokens();
        if (!wyze.accessToken) {
            await wyze.login()
        }

        if (actions.length > 0) {

            const actionList = actions.map(action => {
                return {
                    action_key: action.key,
                    action_params: {
                        list: [
                            {
                                mac: action.device_mac,
                                plist: [
                                    {
                                        pid: action.prop,
                                        pvalue: action.value
                                    }
                                ]
                            }
                        ]
                    },
                    instance_id: action.device_mac,
                    provider_key: action.provider_key
                }
            });

            result = await axios.post(`${wyze.baseUrl}/app/v2/auto/run_action_list`, await wyze.getRequestBodyData({
                action_list: actionList,
                custom_string: ''
            }));

            if (result.data.msg === 'AccessTokenError') {
                await wyze.getRefreshToken()
                return runActionList(actions)
            }
        }

    }
    catch (e) {
        throw e
    }
    return result?.data
}

export default WyzePlugin;

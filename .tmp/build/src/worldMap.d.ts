export interface Map {
    "type": string;
    "features": MapState[];
}
export interface MapState {
    "type": any;
    "properties": {
        "name": string;
    };
    "geometry": any;
    "id": string;
}
export declare let worldMap: Map;

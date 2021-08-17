import { stateInfoType } from "./stateInfo";
export interface mapDataType {
    "id": string;
    "ei": number;
}
export interface dataViewModel {
    "map": string;
    "data": {};
    "ei": number;
    "statedetails": stateInfoType;
}

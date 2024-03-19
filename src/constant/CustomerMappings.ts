import {MappingTypeMapping} from "@elastic/elasticsearch/lib/api/types";

export const mappings: MappingTypeMapping = {
    properties: {
        name: {
            type: "text"
        },
        domain: {
            type: "text"
        }
    }
}

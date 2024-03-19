import {MappingTypeMapping} from "@elastic/elasticsearch/lib/api/types";

export const mappings: MappingTypeMapping = {
    _source: {
        excludes: ["vector"],
    },
    properties: {
        vector: {
            type: "dense_vector",
            dims: 384,
            index: true,
            similarity: "dot_product"
        },
        name: {
            type: "text"
        },
        userFullName: {
            type: "text"
        }
    }
}

export interface ToDo {
    name: string
    userFullName: string
    name_encoded?: Float32Array
}
export interface ToDoSearchRes {
    id: string
    score: number
    index: string
    userFullName: string
}


export interface ToDoSearch {
    name: string
}

export interface Customer {
    id?: string
    name: string
    domain: string
}

export type TodoVector = {
    name: string
    userFullName: string
    vector?: number[]
}

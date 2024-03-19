export default {
    app: {
        port: '2020'
    },
    elastic: {
        name: "vector-db",
        dbUri: "https://localhost:9200",
        apiKey: "ek53SGo0c0JlOE53ZmozNzJwR0s6TWdINjRKd3FTbUdtN212cWRTY3Z6Zw==",
        chunkSize: 100
    },
    allowedPaths: ["/", "/about", "/registerCustomer", "/getAllCustomers", "/deleteCustomer"]
}
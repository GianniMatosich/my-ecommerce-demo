Developer: Gianni Matosich

Title: E-Commerce platform demo

Objective: Create a microservices based e-commerce platform that demonstrates multiple independendent services can work together to handle core retail operations. This platform will be able to assist users in account creation, log in returning users, store product data, and process orders. 

Plan (for development purposes):
1. Services will include a catalog that houses and manages lists of all products, a user service that handles account creation, and a order service which manages orderes made.
2. SQLite will be used to house the database for aforementioned services. Each microservice will have its own database to demonstrate a organic microservices approach.
3. Communication between microservices will be handled using RabbitMQ (in earlier versions I may use REST API for convienience.).
4. Front-End will be handled using React.
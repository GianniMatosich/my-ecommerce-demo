Developer: Gianni Matosich



Title: E-Commerce Platform Demo



Objective: Create a microservices-based e-commerce platform that demonstrates multiple independent services can work together to handle core retail operations. This platform will be able to assist users in account creation, log in returning users, store product data, and process orders. 



Plan (for development purposes):

1. Services will include a catalog that houses and manages lists of all products, a user service that handles account creation, and an order service that manages orders made.

2. SQLite will be used to house the database for the aforementioned services. Each microservice will have its own database to demonstrate an organic microservices approach.

3. Communication between microservices will be handled using RabbitMQ (in earlier versions I may use REST API for convenience.).

4. Front-End will be handled using React.
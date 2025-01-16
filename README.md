# jamify-notification


## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Jamify Notification is a notification microservice handling their collection from a queue to the websocker server. Other type of notifications will be added in the future (mail..).

## Features




## Requirements

- Node.js
- Express.js
- ActiveMQ
- Docker

## Installation




## Configuration



## Usage

- `npm run dev`: Start the development server.
- `npm run start`: Start the production server.
- `npm run test`: Run the tests.

### TODO
Client needs to register by emitting a `register` event with the user's id. It will be saved in the redis database along with its socket id.

Then, it can send messages by sending a POST request to `/api/messages/send` with a ChatMessage Object in the body.

```typescript
export interface ChatMessage {
   id: string;
   senderId: string;
   content: string;
   destId?: string;
   roomId?: string;
   timestamp?: string;
   metadata?: Record<string, any>;
}
```



## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
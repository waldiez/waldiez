[**@waldiez/react v0.4.4**](../../README.md)

***

> `const` **agentMapper**: `object`

Defined in: src/waldiez/models/mappers/agent/agentMapper.ts:52

## Type declaration

### asNode()

> **asNode**: (`agent`, `position?`, `skipLinks?`) => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

#### Parameters

##### agent

[`WaldiezAgent`](../classes/WaldiezAgent.md)

##### position?

###### x

`number`

###### y

`number`

##### skipLinks?

`boolean`

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

### exportAgent()

> **exportAgent**: (`agentNode`, `skipLinks?`) => `any`

#### Parameters

##### agentNode

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

##### skipLinks?

`boolean`

#### Returns

`any`

### importAgent()

> **importAgent**: (`thing`, `agentId?`) => [`WaldiezAgent`](../classes/WaldiezAgent.md)

#### Parameters

##### thing

`unknown`

##### agentId?

`string`

#### Returns

[`WaldiezAgent`](../classes/WaldiezAgent.md)

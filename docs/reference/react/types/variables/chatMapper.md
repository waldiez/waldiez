[**@waldiez/react v0.4.4**](../../README.md)

***

> `const` **chatMapper**: `object`

Defined in: src/waldiez/models/mappers/chat/chatMapper.ts:38

## Type declaration

### asEdge()

> **asEdge**: (`chat`) => [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

#### Parameters

##### chat

[`WaldiezChat`](../classes/WaldiezChat.md)

#### Returns

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

### exportChat()

> **exportChat**: (`edge`, `index`) => `any`

#### Parameters

##### edge

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

##### index

`number`

#### Returns

`any`

### importChat()

> **importChat**: (`json`, `edges`, `nodes`, `index`) => `object`

#### Parameters

##### json

`unknown`

##### edges

`Edge`[]

##### nodes

`Node`[]

##### index

`number`

#### Returns

`object`

##### chat

> **chat**: [`WaldiezChat`](../classes/WaldiezChat.md)

##### edge

> **edge**: `Edge`

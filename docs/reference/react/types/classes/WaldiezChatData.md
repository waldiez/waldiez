[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Chat/ChatData.ts:36

Waldiez Chat Data

## Param

The source

## Param

The target

## Param

The name of the chat

## Param

The description of the chat

## Param

Clear history

## Param

The maximum turns

## Param

The summary

## Param

The position

## Param

The order

## Param

The message

## Param

The nested chat

## Param

The prerequisites (chat ids) for async mode

## Param

The maximum rounds

## Param

The after work

## Param

The flow after work

## Param

The context variables

## Param

The available for handoff condition

## Param

The real source (overrides source)

## Param

The real target (overrides target)

## See

 - [WaldiezMessage](WaldiezMessage.md)
 - [WaldiezChatSummary](../type-aliases/WaldiezChatSummary.md)
 - [WaldiezNestedChat](../type-aliases/WaldiezNestedChat.md)
 - [WaldiezSwarmAfterWork](WaldiezSwarmAfterWork.md)
 - [WaldiezSwarmOnConditionAvailable](../type-aliases/WaldiezSwarmOnConditionAvailable.md)

## Constructors

### Constructor

> **new WaldiezChatData**(`props`): `WaldiezChatData`

Defined in: src/waldiez/models/Chat/ChatData.ts:62

#### Parameters

##### props

###### afterWork

`null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

###### available

[`WaldiezSwarmOnConditionAvailable`](../type-aliases/WaldiezSwarmOnConditionAvailable.md)

###### clearHistory

`boolean`

###### contextVariables

\{[`key`: `string`]: `string`; \}

###### description

`string`

###### flowAfterWork

`null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

###### maxRounds

`number`

###### maxTurns

`null` \| `number`

###### message

[`WaldiezMessage`](WaldiezMessage.md)

###### name

`string`

###### nestedChat

[`WaldiezNestedChat`](../type-aliases/WaldiezNestedChat.md)

###### order

`number`

###### position

`number`

###### prerequisites

`string`[]

###### realSource

`null` \| `string`

###### realTarget

`null` \| `string`

###### source

`string`

###### summary

[`WaldiezChatSummary`](../type-aliases/WaldiezChatSummary.md)

###### target

`string`

#### Returns

`WaldiezChatData`

## Properties

### afterWork

> **afterWork**: `null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

Defined in: src/waldiez/models/Chat/ChatData.ts:53

***

### available

> **available**: [`WaldiezSwarmOnConditionAvailable`](../type-aliases/WaldiezSwarmOnConditionAvailable.md)

Defined in: src/waldiez/models/Chat/ChatData.ts:56

***

### clearHistory

> **clearHistory**: `boolean`

Defined in: src/waldiez/models/Chat/ChatData.ts:43

***

### contextVariables

> **contextVariables**: `object` = `{}`

Defined in: src/waldiez/models/Chat/ChatData.ts:55

#### Index Signature

\[`key`: `string`\]: `string`

***

### description

> **description**: `string`

Defined in: src/waldiez/models/Chat/ChatData.ts:40

***

### flowAfterWork

> **flowAfterWork**: `null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

Defined in: src/waldiez/models/Chat/ChatData.ts:54

***

### maxRounds

> **maxRounds**: `number`

Defined in: src/waldiez/models/Chat/ChatData.ts:52

***

### maxTurns

> **maxTurns**: `null` \| `number`

Defined in: src/waldiez/models/Chat/ChatData.ts:45

***

### message

> **message**: [`WaldiezMessage`](WaldiezMessage.md)

Defined in: src/waldiez/models/Chat/ChatData.ts:44

***

### name

> **name**: `string`

Defined in: src/waldiez/models/Chat/ChatData.ts:39

***

### nestedChat

> **nestedChat**: `object`

Defined in: src/waldiez/models/Chat/ChatData.ts:47

#### message

> **message**: `null` \| [`WaldiezMessage`](WaldiezMessage.md)

#### reply

> **reply**: `null` \| [`WaldiezMessage`](WaldiezMessage.md)

***

### order

> **order**: `number`

Defined in: src/waldiez/models/Chat/ChatData.ts:42

***

### position

> **position**: `number`

Defined in: src/waldiez/models/Chat/ChatData.ts:41

***

### prerequisites

> **prerequisites**: `string`[] = `[]`

Defined in: src/waldiez/models/Chat/ChatData.ts:51

***

### realSource

> **realSource**: `null` \| `string` = `null`

Defined in: src/waldiez/models/Chat/ChatData.ts:60

***

### realTarget

> **realTarget**: `null` \| `string` = `null`

Defined in: src/waldiez/models/Chat/ChatData.ts:61

***

### source

> **source**: `string`

Defined in: src/waldiez/models/Chat/ChatData.ts:37

***

### summary

> **summary**: [`WaldiezChatSummary`](../type-aliases/WaldiezChatSummary.md)

Defined in: src/waldiez/models/Chat/ChatData.ts:46

***

### target

> **target**: `string`

Defined in: src/waldiez/models/Chat/ChatData.ts:38

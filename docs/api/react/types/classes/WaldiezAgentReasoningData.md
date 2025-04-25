[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Reasoning/ReasoningAgentData.ts:26

Waldiez Agent data

## Param

System message

## Param

Human input mode

## Param

Code execution configuration

## Param

Default auto reply

## Param

Maximum consecutive auto reply

## Param

Termination message check

## Param

Model ids

## Param

Linked skills

## Param

Parent id

## Param

Nested chats

## See

 - [WaldiezAgentHumanInputMode](../type-aliases/WaldiezAgentHumanInputMode.md)
 - [WaldiezAgentCodeExecutionConfig](../type-aliases/WaldiezAgentCodeExecutionConfig.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezAgentLinkedSkill](../type-aliases/WaldiezAgentLinkedSkill.md)
 - [WaldiezAgentNestedChat](../type-aliases/WaldiezAgentNestedChat.md)

## Extends

- [`WaldiezAgentData`](WaldiezAgentData.md)

## Constructors

### Constructor

> **new WaldiezAgentReasoningData**(`props`): `WaldiezAgentReasoningData`

Defined in: src/waldiez/models/Agent/Reasoning/ReasoningAgentData.ts:30

#### Parameters

##### props

###### agentDefaultAutoReply

`null` \| `string`

###### codeExecutionConfig

[`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

###### humanInputMode

[`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

###### maxConsecutiveAutoReply

`null` \| `number`

###### modelIds

`string`[]

###### nestedChats

[`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

###### parentId

`null` \| `string`

###### reasonConfig

[`WaldiezReasoningAgentReasonConfig`](../type-aliases/WaldiezReasoningAgentReasonConfig.md)

###### skills

[`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

###### systemMessage

`null` \| `string`

###### termination

[`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

###### verbose

`boolean`

#### Returns

`WaldiezAgentReasoningData`

#### Overrides

[`WaldiezAgentData`](WaldiezAgentData.md).[`constructor`](WaldiezAgentData.md#constructor)

## Properties

### agentDefaultAutoReply

> **agentDefaultAutoReply**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:35

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`agentDefaultAutoReply`](WaldiezAgentData.md#agentdefaultautoreply)

***

### codeExecutionConfig

> **codeExecutionConfig**: [`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:34

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`codeExecutionConfig`](WaldiezAgentData.md#codeexecutionconfig)

***

### humanInputMode

> **humanInputMode**: [`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:33

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`humanInputMode`](WaldiezAgentData.md#humaninputmode)

***

### maxConsecutiveAutoReply

> **maxConsecutiveAutoReply**: `null` \| `number`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:36

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`maxConsecutiveAutoReply`](WaldiezAgentData.md#maxconsecutiveautoreply)

***

### modelIds

> **modelIds**: `string`[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:39

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`modelIds`](WaldiezAgentData.md#modelids)

***

### nestedChats

> **nestedChats**: [`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:42

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`nestedChats`](WaldiezAgentData.md#nestedchats)

***

### parentId

> **parentId**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:41

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`parentId`](WaldiezAgentData.md#parentid)

***

### reasonConfig

> **reasonConfig**: [`WaldiezReasoningAgentReasonConfig`](../type-aliases/WaldiezReasoningAgentReasonConfig.md)

Defined in: src/waldiez/models/Agent/Reasoning/ReasoningAgentData.ts:28

***

### skills

> **skills**: [`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:40

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`skills`](WaldiezAgentData.md#skills)

***

### systemMessage

> **systemMessage**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:32

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`systemMessage`](WaldiezAgentData.md#systemmessage)

***

### termination

> **termination**: [`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:37

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`termination`](WaldiezAgentData.md#termination)

***

### verbose

> **verbose**: `boolean`

Defined in: src/waldiez/models/Agent/Reasoning/ReasoningAgentData.ts:27

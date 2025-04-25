[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:40

Waldiez Group Manager Agent Data.

## Param

The human input mode of the agent ("NEVER" | "ALWAYS" | "SOMETIMES")

## Param

The system message of the agent

## Param

The code execution configuration of the agent

## Param

The default auto reply of the agent

## Param

The maximum consecutive auto reply of the agent

## Param

The termination message check of the agent

## Param

The model ids of the agent

## Param

The linked skills of the agent

## Param

The parent id of the agent

## Param

The nested chats of the agent

## Param

The maximum round of the agent

## Param

The admin name of the agent

## Param

The speakers of the agent

## Param

The enable clear history of the agent

## Param

The send introductions of the agent

## See

 - [WaldiezAgentData](WaldiezAgentData.md)
 - [WaldiezAgentLinkedSkill](../type-aliases/WaldiezAgentLinkedSkill.md)
 - [WaldiezAgentNestedChat](../type-aliases/WaldiezAgentNestedChat.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezAgentGroupManagerSpeakers](WaldiezAgentGroupManagerSpeakers.md)
 - [WaldiezAgentHumanInputMode](../type-aliases/WaldiezAgentHumanInputMode.md)
 - [WaldiezAgentCodeExecutionConfig](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

## Extends

- [`WaldiezAgentData`](WaldiezAgentData.md)

## Constructors

### Constructor

> **new WaldiezAgentGroupManagerData**(`props`): `WaldiezAgentGroupManagerData`

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:47

#### Parameters

##### props

###### adminName

`null` \| `string`

###### agentDefaultAutoReply

`null` \| `string`

###### codeExecutionConfig

[`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

###### enableClearHistory?

`boolean`

###### humanInputMode

[`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

###### maxConsecutiveAutoReply

`null` \| `number`

###### maxRound

`null` \| `number`

###### modelIds

`string`[]

###### nestedChats

[`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

###### parentId

`null` \| `string`

###### sendIntroductions?

`boolean`

###### skills

[`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

###### speakers

[`WaldiezAgentGroupManagerSpeakers`](WaldiezAgentGroupManagerSpeakers.md)

###### systemMessage

`null` \| `string`

###### termination

[`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

#### Returns

`WaldiezAgentGroupManagerData`

#### Overrides

[`WaldiezAgentData`](WaldiezAgentData.md).[`constructor`](WaldiezAgentData.md#constructor)

## Properties

### adminName

> **adminName**: `null` \| `string`

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:42

***

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

### enableClearHistory?

> `optional` **enableClearHistory**: `boolean`

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:44

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

### maxRound

> **maxRound**: `null` \| `number`

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:41

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

### sendIntroductions?

> `optional` **sendIntroductions**: `boolean`

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:45

***

### skills

> **skills**: [`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:40

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`skills`](WaldiezAgentData.md#skills)

***

### speakers

> **speakers**: [`WaldiezAgentGroupManagerSpeakers`](WaldiezAgentGroupManagerSpeakers.md)

Defined in: src/waldiez/models/Agent/GroupManager/GroupManagerData.ts:43

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

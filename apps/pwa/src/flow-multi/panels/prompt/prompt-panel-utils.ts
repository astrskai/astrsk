import { PromptMessage, PlainPromptMessage, HistoryPromptMessage, parsePromptMessage, HistoryType, PromptMessageType } from "@/modules/agent/domain";
import { PromptBlockType } from "@/shared/prompt/domain";
import { UniqueEntityID } from "@/shared/domain";
import { PromptItem } from "./prompt-panel-types";

/**
 * Convert agent's PromptMessage array to UI-friendly PromptItem array
 */
export function convertPromptMessagesToItems(promptMessages: PromptMessage[]): PromptItem[] {
  // Parse raw objects back into domain classes if needed
  const parsedMessages = promptMessages.map(msg => {
    // If it's already a domain instance, use it directly
    if (msg instanceof PlainPromptMessage || msg instanceof HistoryPromptMessage) {
      return msg;
    }
    
    // Otherwise, parse the raw object into the proper domain class using parsePromptMessage
    const parsed = parsePromptMessage(msg as any);
    if (parsed.isFailure) {
      console.error('[CONVERT] Failed to parse message:', parsed.getError());
      return msg; // Fallback to original if parsing fails
    }
    return parsed.getValue();
  });
  
  console.log('[CONVERT] Converting prompt messages to items:', {
    inputLength: promptMessages?.length,
    parsedLength: parsedMessages?.length,
    originalTypes: promptMessages?.map((msg: any) => msg.constructor?.name || 'plain object'),
    parsedTypes: parsedMessages?.map(msg => msg.constructor.name)
  });

  return parsedMessages.map((msg): PromptItem => {
    const msgAny = msg as any;
    let parsedMessage = msg;
    if (!(msg instanceof PlainPromptMessage || msg instanceof HistoryPromptMessage)) {

      const parsed = parsePromptMessage(msgAny as any);
      if (parsed.isFailure) {
        console.error('[CONVERT] Failed to parse message:', parsed.getError());
        return msg; // Fallback to original if parsing fails
      }
      parsedMessage = parsed.getValue();
    }
    // Check if it's a plain message (either instance or plain object with type='plain')
    const isPlainMessage = parsedMessage instanceof PlainPromptMessage;
    const isHistoryMessage = parsedMessage instanceof HistoryPromptMessage;

    if (isPlainMessage) {
      // Handle both domain instances and plain objects
      const promptBlocks = parsedMessage.promptBlocks || [];
      const id = parsedMessage.id.toString();
      const role = parsedMessage.role || 'user';
      const enabled = parsedMessage.props.enabled;

      // Extract content from prompt blocks
      const content = promptBlocks
        .map((block:any) => {
          // Check if this is a PlainBlock with template property
          if ('template' in block && block.template) {
            return block.template;
          }
          // Fallback to content property if available
          if ('content' in block) {
            return block.content || '';
          }
          return '';
        })
        .join('\n');
      
      // Try to use the first block's name as the label, or a combination of block names
      let label = `Message`;
      if (promptBlocks.length > 0) {
        // Get names from blocks that have them
        const blockNames = promptBlocks
          .filter((block:any) => 'name' in block && block.name)
          .map((block:any) => block.name);
        
        if (blockNames.length > 0) {
          // Use first block name or combine multiple
          label = blockNames.length === 1 ? blockNames[0] : blockNames.join(' + ');
        }
      }
      
      return {
        id,
        label,
        enabled: enabled ?? true,
        content,
        role,
        type: "regular",
      };
    } else if (isHistoryMessage) {
      // Handle both domain instances and plain objects
      const userBlocks = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.userPromptBlocks || [] : [];
      const id = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.id.toString() : msgAny._id?.value || msgAny.id;
      const enabled = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.props.enabled : msgAny.props?.enabled;
      const start = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.start : msgAny.props?.start;
      const end = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.end : msgAny.props?.end;
      const countFromEnd = parsedMessage instanceof HistoryPromptMessage ? parsedMessage.countFromEnd : msgAny.props?.countFromEnd;
      
      const content = userBlocks
        .map((block:any) => {
          // Check if this is a PlainBlock with template property
          if ('template' in block && block.template) {
            return block.template;
          }
          // Fallback to content property if available
          if ('content' in block) {
            return block.content || '';
          }
          return '';
        })
        .join('\n');
      
      // Create a more descriptive label for history messages
      let label = `History`;
      if (start !== undefined && end !== undefined) {
        const fromEnd = countFromEnd !== false;
        if (fromEnd) {
          label = `History (last ${end - start} messages)`;
        } else {
          label = `History (messages ${start}-${end})`;
        }
      }

      
      return {
        id,
        label,
        enabled: enabled ?? true,
        content,
        role: "assistant", // History messages are typically assistant role
        type: "history",
        start,
        end,
        countFromEnd,
      };
    }
    
    // Fallback for unknown message types
    return {
      id: (msg as any).id?.toString() || new UniqueEntityID().toString(),
      label: `Message`,
      enabled: true,
      content: "",
      role: "system",
      type: "regular",
    };
  });
}

/**
 * Convert UI PromptItem array to agent's PromptMessage format
 */
export function convertItemsToPromptMessages(items: PromptItem[]): PromptMessage[] {
  return items.map(item => {
    let messageData: any;
    
    if (item.type === "history") {
      messageData = {
        id: item.id,
        type: PromptMessageType.History,
        enabled: item.enabled,
        historyType: HistoryType.Split,
        start: item.start || 0,
        end: item.end || 8,
        countFromEnd: item.countFromEnd ?? true,
        createdAt: new Date().toISOString(),
        userPromptBlocks: [{
          id: new UniqueEntityID().toString(),
          type: PromptBlockType.Plain,
          name: item.label,
          template: item.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        assistantPromptBlocks: [{
          id: new UniqueEntityID().toString(),
          type: PromptBlockType.Plain,
          name: item.label,
          template: item.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      };
    } else {
      // Regular message
      messageData = {
        id: item.id,
        type: PromptMessageType.Plain,
        enabled: item.enabled,
        role: item.role,
        createdAt: new Date().toISOString(),
        promptBlocks: [{
          id: new UniqueEntityID().toString(),
          type: PromptBlockType.Plain,
          name: item.label, // Use the label as the block name
          template: item.content, // Store content as template
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      };
    }
    
    // Parse the JSON data into proper domain objects
    const result = parsePromptMessage(messageData);
    if (result.isFailure) {
      console.error("Failed to parse prompt message:", result.getError());
      throw new Error(`Failed to parse prompt message: ${result.getError()}`);
    }
    
    return result.getValue();
  });
}
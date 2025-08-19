import { PromptMessage, PlainPromptMessage, HistoryPromptMessage, parsePromptMessage, HistoryType, PromptMessageType } from "@/modules/agent/domain";
import { PromptBlockType } from "@/shared/prompt/domain";
import { UniqueEntityID } from "@/shared/domain";
import { PromptItem } from "./prompt-panel-types";

/**
 * Convert agent's PromptMessage array to UI-friendly PromptItem array
 */
export function convertPromptMessagesToItems(promptMessages: PromptMessage[]): PromptItem[] {
  return promptMessages.map((msg): PromptItem => {
    const msgAny = msg as any;
    
    // Check if it's a plain message (either instance or plain object with type='plain')
    const isPlainMessage = msg instanceof PlainPromptMessage || msgAny.type === 'plain';
    const isHistoryMessage = msg instanceof HistoryPromptMessage || msgAny.type === 'history';
    
    if (isPlainMessage) {
      // Get prompt blocks from either instance property or direct property
      const promptBlocks = (msg instanceof PlainPromptMessage) ? msg.promptBlocks : msgAny.promptBlocks || [];
      const id = (msg instanceof PlainPromptMessage) ? msg.id.toString() : msgAny.id;
      const role = (msg instanceof PlainPromptMessage) ? msg.role : msgAny.role;
      const enabled = (msg instanceof PlainPromptMessage) ? msg.props.enabled : msgAny.enabled;
      
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
      let label = `Message ${id.slice(0, 8)}`;
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
      // For history messages, extract content similarly
      const userBlocks = (msg instanceof HistoryPromptMessage) ? msg.userPromptBlocks : msgAny.userPromptBlocks || [];
      const id = (msg instanceof HistoryPromptMessage) ? msg.id.toString() : msgAny.id;
      const enabled = (msg instanceof HistoryPromptMessage) ? msg.props.enabled : msgAny.enabled;
      const start = (msg instanceof HistoryPromptMessage) ? msg.start : msgAny.start;
      const end = (msg instanceof HistoryPromptMessage) ? msg.end : msgAny.end;
      const countFromEnd = (msg instanceof HistoryPromptMessage) ? msg.countFromEnd : msgAny.countFromEnd;
      
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
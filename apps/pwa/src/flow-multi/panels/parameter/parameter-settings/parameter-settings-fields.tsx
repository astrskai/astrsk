// Parameter settings fields component for flow-multi
// Manages parameter configuration UI for agents
"use client";

import { Plus, RefreshCcw, X, Check } from "lucide-react";
import { useState } from "react";

import { Parameter, parameterList } from "@/shared/task/domain/parameter";

import { SearchInput } from "@/components-v2/search-input";
import { Typo2XLarge, TypoBase } from "@/components-v2/typo";
import { Card, CardContent } from "@/components-v2/ui/card";
import { Input } from "@/components-v2/ui/input";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { Switch } from "@/components-v2/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components-v2/ui/select";

export type ParameterValue = number | string | boolean;

export interface ParameterFieldsProps {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  showSearch?: boolean;
  className?: string;
  initialEnabledParameters?: Map<string, boolean>;
  initialParameterValues?: Map<string, ParameterValue>;
  onParameterChange?: (
    parameterId: string,
    enabled: boolean,
    value?: ParameterValue,
  ) => void;
}

const ParameterItem = ({
  parameter,
  initialEnabled,
  initialValue,
  onParameterChange,
}: {
  parameter: Parameter;
  initialEnabled?: boolean;
  initialValue?: ParameterValue;
  onParameterChange?: (
    parameterId: string,
    enabled: boolean,
    value?: ParameterValue,
  ) => void;
}) => {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [value, setValue] = useState(initialValue ?? parameter.default);

  // Handle parameter enable/disable changes
  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled && value === undefined) {
      setValue(parameter.default);
      onParameterChange?.(parameter.id, newEnabled, parameter.default);
    } else {
      onParameterChange?.(parameter.id, newEnabled, value);
    }
  };

  // Handle parameter value changes
  const handleValueChange = (newValue: ParameterValue) => {
    setValue(newValue);
    onParameterChange?.(parameter.id, enabled, newValue);
  };

  // logitBiases state for logit_bias type
  const [logitBiases, setLogitBiases] = useState<
    { token: string; bias: number }[]
  >(() => {
    if (parameter.type === "logit_bias" && typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Safety settings
  const [safetySettings, setSafetySettings] = useState<
    { category: string; threshold: string }[]
  >(() => {
    if (parameter.type === "safety_settings" && typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  });

  // If disabled (collapsed state)
  if (!enabled) {
    return (
      <div className="self-stretch inline-flex justify-start items-start gap-2 mb-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          size="small"
        />
        <div className="flex-1 p-2 bg-background-surface-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-secondary text-xs font-normal">
            {parameter.label}
          </div>
        </div>
      </div>
    );
  }

  // For boolean parameters when enabled
  if (parameter.type === "boolean") {
    return (
      <div className="self-stretch inline-flex justify-start items-start gap-2 mb-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          size="small"
        />
        <div className="flex-1 p-2 bg-background-surface-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-start items-center gap-2">
          <button
            onClick={() => handleValueChange(!value)}
            className="p-[1.33px] bg-background-surface-3 rounded flex justify-start items-center gap-1.5"
          >
            <div className="w-3.5 h-3.5 relative rounded overflow-hidden flex items-center justify-center">
              {Boolean(value) && (
                <Check className="min-w-2.5 min-h-2.5 w-2.5 h-2.5 text-text-primary" />
              )}
            </div>
          </button>
          <div className="justify-start text-text-primary text-xs font-medium">
            {parameter.label}
          </div>
        </div>
      </div>
    );
  }

  // For other parameter types when enabled (expanded state)
  return (
    <div className="self-stretch inline-flex justify-start items-start gap-2 mb-2">
      <Switch
        checked={enabled}
        onCheckedChange={handleEnabledChange}
        size="small"
      />
      <div className="flex-1 p-2 bg-background-surface-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-primary text-xs font-medium">
            {parameter.label}
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          {parameter.type === "number" && (
            <>
              <div className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-between items-center overflow-hidden">
                <div className="flex-1 flex justify-start items-center gap-4">
                  <input
                    type="number"
                    value={value as number}
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step}
                    onChange={(e) => handleValueChange(Number(e.target.value))}
                    className="justify-start text-text-primary text-xs font-normal bg-transparent outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div
                  className="w-4 h-4 relative overflow-hidden cursor-pointer"
                  onClick={() => handleValueChange(parameter.default)}
                >
                  <RefreshCcw className="w-3 h-3 absolute left-[2px] top-[2px] text-background-surface-5" />
                </div>
              </div>
              <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
                <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
                  {parameter.min !== undefined && parameter.max !== undefined
                    ? `Minimum is ${parameter.min}, maximum is ${parameter.max}`
                    : parameter.min !== undefined
                      ? `Minimum is ${parameter.min}`
                      : parameter.max !== undefined
                        ? `Maximum is ${parameter.max}`
                        : ""}
                </div>
              </div>
            </>
          )}
          {parameter.type === "string" && (
            <Input
              value={value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full"
            />
          )}
          {parameter.type === "logit_bias" && (
            <>
              <div className="self-stretch pr-8 flex flex-col justify-start items-start gap-2">
                <button
                  onClick={() => {
                    const newLogitBiases = [...logitBiases];
                    newLogitBiases.push({ token: "", bias: 0 });
                    setLogitBiases(newLogitBiases);
                    const fieldValue = JSON.stringify(newLogitBiases);
                    handleValueChange(fieldValue);
                  }}
                  className="w-48 h-7 px-3 py-2 bg-background-surface-0 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-center items-center gap-2"
                >
                  <Plus className="min-w-4 min-h-4 text-text-primary" />
                  <div className="justify-center text-text-primary text-xs font-semibold leading-none">
                    Logit bias
                  </div>
                </button>
              </div>
              {logitBiases.length > 0 && (
                <div className="self-stretch flex flex-col gap-2">
                  {logitBiases.map((logitBias, index) => (
                    <div
                      key={index}
                      className="self-stretch flex flex-col gap-1"
                    >
                      <div className="self-stretch inline-flex justify-start items-start gap-1.5">
                        <Input
                          value={logitBias.token}
                          onChange={(e) => {
                            const newLogitBiases = [...logitBiases];
                            newLogitBiases[index].token = e.target.value;
                            setLogitBiases(newLogitBiases);
                            const fieldValue = JSON.stringify(newLogitBiases);
                            handleValueChange(fieldValue);
                          }}
                          placeholder="Token"
                          className="flex-1"
                        />
                        <div className="w-28 inline-flex flex-col justify-start items-start">
                          <div className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-between items-center overflow-hidden">
                            <div className="flex-1 flex justify-start items-center gap-4">
                              <input
                                type="number"
                                className="justify-start text-text-primary text-xs font-normal bg-transparent outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={parameter.min}
                                max={parameter.max}
                                step={parameter.step}
                                value={logitBias.bias}
                                onChange={(e) => {
                                  const newLogitBiases = [...logitBiases];
                                  newLogitBiases[index].bias = Number(
                                    e.target.value,
                                  );
                                  setLogitBiases(newLogitBiases);
                                  const fieldValue =
                                    JSON.stringify(newLogitBiases);
                                  handleValueChange(fieldValue);
                                }}
                                placeholder="0"
                              />
                            </div>
                            <div className="w-4 h-4 relative overflow-hidden">
                              <div className="w-1.5 h-2.5 left-[4.67px] top-[2.67px] absolute outline outline-[1.33px] outline-offset-[-0.67px] outline-background-surface-5"></div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newLogitBiases = [...logitBiases];
                            newLogitBiases.splice(index, 1);
                            setLogitBiases(newLogitBiases);
                            const fieldValue = JSON.stringify(newLogitBiases);
                            handleValueChange(fieldValue);
                          }}
                          className="w-6 h-6 relative rounded-sm flex-shrink-0"
                        >
                          <X className="min-w-3.5 min-h-4 absolute left-[5px] top-[4px] text-text-subtle" />
                        </button>
                      </div>
                      {parameter.min !== undefined &&
                        parameter.max !== undefined &&
                        index === logitBiases.length - 1 && (
                          <div className="self-stretch inline-flex justify-center items-center gap-1.5">
                            <div className="flex-1 h-2.5"></div>
                            <div className="w-28 justify-start text-text-info text-[10px] font-medium leading-none">
                              Min {parameter.min} / Max {parameter.max}
                            </div>
                            <div className="w-6 h-2.5"></div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {parameter.type === "safety_settings" && (
            <>
              <div className="self-stretch pr-8 flex flex-col justify-start items-start gap-2">
                <button
                  onClick={() => {
                    const newSafetySettings = [...safetySettings];
                    newSafetySettings.push({ category: "", threshold: "" });
                    setSafetySettings(newSafetySettings);
                    const fieldValue = JSON.stringify(newSafetySettings);
                    handleValueChange(fieldValue);
                  }}
                  className="w-48 h-7 px-3 py-2 bg-background-surface-0 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-center items-center gap-2"
                >
                  <Plus className="min-w-4 min-h-4 text-text-primary" />
                  <div className="justify-center text-text-primary text-xs font-semibold leading-none">
                    Safety settings
                  </div>
                </button>
              </div>
              {safetySettings.length > 0 && (
                <div className="self-stretch flex flex-col gap-2">
                  {safetySettings.map((item, index) => (
                    <div
                      key={index}
                      className="self-stretch flex flex-col gap-1"
                    >
                      <div className="self-stretch inline-flex justify-start items-start gap-1.5">
                        <Input
                          value={item.category}
                          onChange={(e) => {
                            const newSafetySettings = [...safetySettings];
                            newSafetySettings[index].category = e.target.value;
                            setSafetySettings(newSafetySettings);
                            const fieldValue =
                              JSON.stringify(newSafetySettings);
                            handleValueChange(fieldValue);
                          }}
                          placeholder="Category"
                          className="flex-1"
                        />
                        <Input
                          value={item.threshold}
                          onChange={(e) => {
                            const newSafetySettings = [...safetySettings];
                            newSafetySettings[index].threshold = e.target.value;
                            setSafetySettings(newSafetySettings);
                            const fieldValue =
                              JSON.stringify(newSafetySettings);
                            handleValueChange(fieldValue);
                          }}
                          placeholder="Threshold"
                          className="flex-1"
                        />
                        <button
                          onClick={() => {
                            const newSafetySettings = [...safetySettings];
                            newSafetySettings.splice(index, 1);
                            setSafetySettings(newSafetySettings);
                            const fieldValue =
                              JSON.stringify(newSafetySettings);
                            handleValueChange(fieldValue);
                          }}
                          className="w-6 h-6 relative rounded-sm flex-shrink-0"
                        >
                          <X className="min-w-3.5 min-h-4 absolute left-[5px] top-[4px] text-text-subtle" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {parameter.type === "enum" && (
            <Select
              value={value}
              onValueChange={(value) => handleValueChange(value)}
            >
              <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parameter.enums?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

export function ParameterSettingsFields({
  searchTerm,
  className,
  initialEnabledParameters,
  initialParameterValues,
  onParameterChange,
}: ParameterFieldsProps) {
  const filteredParameters = searchTerm
    ? parameterList.filter(
        (param) =>
          param.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          param.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : parameterList;

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="bg-background-surface-2 flex flex-col gap-2">
        {filteredParameters.map((parameter) => (
          <ParameterItem
            key={parameter.id}
            parameter={parameter}
            initialEnabled={initialEnabledParameters?.get(parameter.id)}
            initialValue={initialParameterValues?.get(parameter.id)}
            onParameterChange={onParameterChange}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export function ParameterSettingsPage({
  initialEnabledParameters,
  initialParameterValues,
  onParameterChange,
}: ParameterFieldsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col gap-6 w-[719px] h-[calc(100vh-300px)]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Typo2XLarge>Set Parameters</Typo2XLarge>
          <Typo2XLarge className="text-status-optional">(Optional)</Typo2XLarge>
        </div>
        <TypoBase className="text-text-input-subtitle mask-clip-content">
          Optimize agent performance by adjusting parameters.
        </TypoBase>
      </div>
      <SearchInput
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Card className="w-full h-[calc(100vh-310px)] pt-6">
        <CardContent className="bg-background-card rounded-2xl">
          <ParameterSettingsFields
            searchTerm={searchTerm}
            initialEnabledParameters={initialEnabledParameters}
            initialParameterValues={initialParameterValues}
            onParameterChange={onParameterChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

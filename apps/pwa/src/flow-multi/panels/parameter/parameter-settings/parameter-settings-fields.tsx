// Parameter settings fields component for flow-multi
// Manages parameter configuration UI for agents
"use client";

import { Plus, RefreshCcw, X, Check } from "lucide-react";
import { useState, useEffect } from "react";

import { Parameter, parameterList } from "@/shared/task/domain/parameter";

import { SearchInput } from "@/components/ui/search-input";
import { Typo2XLarge, TypoBase } from "@/components/ui/typo";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Switch } from "@/components-v2/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

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

  // Sync state when props change (for cross-tab updates)
  useEffect(() => {
    setEnabled(initialEnabled ?? false);
  }, [initialEnabled]);

  useEffect(() => {
    setValue(initialValue ?? parameter.default);
  }, [initialValue, parameter.default]);

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

  // Update logitBiases when value changes
  useEffect(() => {
    if (parameter.type === "logit_bias" && typeof value === "string") {
      try {
        setLogitBiases(JSON.parse(value));
      } catch {
        setLogitBiases([]);
      }
    }
  }, [value, parameter.type]);

  // Update safetySettings when value changes
  useEffect(() => {
    if (parameter.type === "safety_settings" && typeof value === "string") {
      try {
        setSafetySettings(JSON.parse(value));
      } catch {
        setSafetySettings([]);
      }
    }
  }, [value, parameter.type]);

  // If disabled (collapsed state)
  if (!enabled) {
    return (
      <div className="mb-2 inline-flex items-start justify-start gap-2 self-stretch">
        <Switch
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          size="small"
        />
        <div className="bg-background-surface-2 outline-border-normal inline-flex flex-1 items-center justify-start gap-2 rounded-lg p-2 outline outline-1 outline-offset-[-1px]">
          <div className="text-text-secondary justify-start text-xs font-normal">
            {parameter.label}
          </div>
        </div>
      </div>
    );
  }

  // For boolean parameters when enabled
  if (parameter.type === "boolean") {
    return (
      <div className="mb-2 inline-flex items-start justify-start gap-2 self-stretch">
        <Switch
          checked={enabled}
          onCheckedChange={handleEnabledChange}
          size="small"
        />
        <div className="bg-background-surface-2 outline-border-normal inline-flex flex-1 items-center justify-start gap-2 rounded-lg p-2 outline outline-1 outline-offset-[-1px]">
          <button
            onClick={() => handleValueChange(!value)}
            className="bg-background-surface-3 flex items-center justify-start gap-1.5 rounded p-[1.33px]"
          >
            <div className="relative flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded">
              {Boolean(value) && (
                <Check className="text-text-primary h-2.5 min-h-2.5 w-2.5 min-w-2.5" />
              )}
            </div>
          </button>
          <div className="text-text-primary justify-start text-xs font-medium">
            {parameter.label}
          </div>
        </div>
      </div>
    );
  }

  // For other parameter types when enabled (expanded state)
  return (
    <div className="mb-2 inline-flex items-start justify-start gap-2 self-stretch">
      <Switch
        checked={enabled}
        onCheckedChange={handleEnabledChange}
        size="small"
      />
      <div className="bg-background-surface-2 outline-border-normal inline-flex flex-1 flex-col items-start justify-start gap-2 rounded-lg p-2 outline outline-1 outline-offset-[-1px]">
        <div className="inline-flex items-center justify-start gap-2 self-stretch">
          <div className="text-text-primary justify-start text-xs font-medium">
            {parameter.label}
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 self-stretch">
          {parameter.type === "number" && (
            <>
              <div className="bg-background-surface-0 outline-border-normal inline-flex min-h-8 items-center justify-between self-stretch overflow-hidden rounded-md px-4 py-2 outline outline-1 outline-offset-[-1px]">
                <div className="flex flex-1 items-center justify-start gap-4">
                  <input
                    type="number"
                    value={value as number}
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step}
                    onChange={(e) => handleValueChange(Number(e.target.value))}
                    className="text-text-primary w-full [appearance:textfield] justify-start bg-transparent text-xs font-normal outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <div
                  className="relative h-4 w-4 cursor-pointer overflow-hidden"
                  onClick={() => handleValueChange(parameter.default)}
                >
                  <RefreshCcw className="text-background-surface-5 absolute top-[2px] left-[2px] h-3 w-3" />
                </div>
              </div>
              <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
                <div className="text-text-info flex-1 justify-start text-[10px] leading-none font-medium">
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
              <div className="flex flex-col items-start justify-start gap-2 self-stretch pr-8">
                <button
                  onClick={() => {
                    const newLogitBiases = [...logitBiases];
                    newLogitBiases.push({ token: "", bias: 0 });
                    setLogitBiases(newLogitBiases);
                    const fieldValue = JSON.stringify(newLogitBiases);
                    handleValueChange(fieldValue);
                  }}
                  className="bg-background-surface-0 outline-border-normal inline-flex h-7 w-48 items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px]"
                >
                  <Plus className="text-text-primary min-h-4 min-w-4" />
                  <div className="text-text-primary justify-center text-xs leading-none font-semibold">
                    Logit bias
                  </div>
                </button>
              </div>
              {logitBiases.length > 0 && (
                <div className="flex flex-col gap-2 self-stretch">
                  {logitBiases.map((logitBias, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-1 self-stretch"
                    >
                      <div className="inline-flex items-start justify-start gap-1.5 self-stretch">
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
                        <div className="inline-flex w-28 flex-col items-start justify-start">
                          <div className="bg-background-surface-0 outline-border-normal inline-flex min-h-8 items-center justify-between self-stretch overflow-hidden rounded-md px-4 py-2 outline outline-1 outline-offset-[-1px]">
                            <div className="flex flex-1 items-center justify-start gap-4">
                              <input
                                type="number"
                                className="text-text-primary w-full [appearance:textfield] justify-start bg-transparent text-xs font-normal outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                            <div className="relative h-4 w-4 overflow-hidden">
                              <div className="outline-background-surface-5 absolute top-[2.67px] left-[4.67px] h-2.5 w-1.5 outline outline-[1.33px] outline-offset-[-0.67px]"></div>
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
                          className="relative h-6 w-6 flex-shrink-0 rounded-sm"
                        >
                          <X className="text-text-subtle absolute top-[4px] left-[5px] min-h-4 min-w-3.5" />
                        </button>
                      </div>
                      {parameter.min !== undefined &&
                        parameter.max !== undefined &&
                        index === logitBiases.length - 1 && (
                          <div className="inline-flex items-center justify-center gap-1.5 self-stretch">
                            <div className="h-2.5 flex-1"></div>
                            <div className="text-text-info w-28 justify-start text-[10px] leading-none font-medium">
                              Min {parameter.min} / Max {parameter.max}
                            </div>
                            <div className="h-2.5 w-6"></div>
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
              <div className="flex flex-col items-start justify-start gap-2 self-stretch pr-8">
                <button
                  onClick={() => {
                    const newSafetySettings = [...safetySettings];
                    newSafetySettings.push({ category: "", threshold: "" });
                    setSafetySettings(newSafetySettings);
                    const fieldValue = JSON.stringify(newSafetySettings);
                    handleValueChange(fieldValue);
                  }}
                  className="bg-background-surface-0 outline-border-normal inline-flex h-7 w-48 items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px]"
                >
                  <Plus className="text-text-primary min-h-4 min-w-4" />
                  <div className="text-text-primary justify-center text-xs leading-none font-semibold">
                    Safety settings
                  </div>
                </button>
              </div>
              {safetySettings.length > 0 && (
                <div className="flex flex-col gap-2 self-stretch">
                  {safetySettings.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-1 self-stretch"
                    >
                      <div className="inline-flex items-start justify-start gap-1.5 self-stretch">
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
                          className="relative h-6 w-6 flex-shrink-0 rounded-sm"
                        >
                          <X className="text-text-subtle absolute top-[4px] left-[5px] min-h-4 min-w-3.5" />
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
              <SelectTrigger className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]">
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
    <div className="flex h-[calc(100vh-300px)] w-[719px] flex-col gap-6">
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
      <Card className="h-[calc(100vh-310px)] w-full pt-6">
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

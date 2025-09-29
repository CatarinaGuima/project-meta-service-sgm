"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StepIndicator } from "@/components/ui/step-indicator";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { FormActionsButton } from "@/components/ui/button/FormActionsButton";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Geração dinâmica de opções de horário
const generateTimeOptions = (start: number, end: number) => {
  const options = [];
  for (let i = start; i <= end; i++) {
    const hour = i.toString().padStart(2, "0");
    options.push({
      value: `${hour}:00`,
      label: `${hour}:00`,
    });
  }
  return options;
};

const allHours = generateTimeOptions(0, 23);

// Horários por turno
const shiftHours = {
  manha: generateTimeOptions(6, 11),
  tarde: generateTimeOptions(12, 17),
  noite: generateTimeOptions(18, 23),
  integral: generateTimeOptions(0, 23),
};

// Schema de validação
const contractSchema = z.object({
  department: z.string().min(2, "Mínimo 2 caracteres"),
  position: z.string().min(1, "Selecione um cargo"),
  contractType: z.string().min(1, "Selecione um tipo"),
  unit: z.string().min(2, "Mínimo 2 caracteres"),
  shift: z.string().min(1, "Selecione um turno"),
  startTime: z.string().min(1, "Selecione um horário inicial"),
  endTime: z.string().min(1, "Selecione um horário final"),
  hourlyWage: z.string().regex(/^\d+,\d{2}$/, "Formato inválido (0,00)"),
  admissionDate: z.date(),
  probationPeriod: z.string().min(1, "Informe o período"),
  supervisor: z.string().min(1, "Selecione um superior"),
  hierarchyLevel: z.string().min(1, "Selecione um nível"),
  contractDate: z.date(),
  contractDuration: z.string().min(1, "Informe a duração"),
  contractExpiration: z.date(),
  totalDays: z.string().regex(/^\d+$/, "Apenas números"),
});

type ContractFormData = z.infer<typeof contractSchema>;

// Opções para selects
const positions = [
  { value: "analista", label: "Analista" },
  { value: "gerente", label: "Gerente" },
  { value: "assistente", label: "Assistente" },
];

const contractTypes = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "temporario", label: "Temporário" },
];

const shifts = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "integral", label: "Integral" },
];

const supervisors = [
  { value: "joao", label: "João da Silva" },
  { value: "maria", label: "Maria Santos" },
  { value: "carlos", label: "Carlos Oliveira" },
];

const hierarchyLevels = [
  { value: "estagiario", label: "Estagiário" },
  { value: "assistente", label: "Assistente" },
  { value: "analista", label: "Analista" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gerente", label: "Gerente" },
  { value: "diretor", label: "Diretor" },
];

export default function ContractRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      department: "",
      position: "",
      contractType: "",
      unit: "",
      shift: "",
      startTime: "",
      endTime: "",
      hourlyWage: "",
      admissionDate: new Date(),
      probationPeriod: "",
      supervisor: "",
      hierarchyLevel: "",
      contractDate: new Date(),
      contractDuration: "",
      contractExpiration: new Date(),
      totalDays: "",
    },
  });

  const selectedShift = form.watch("shift");
  const selectedStartTime = form.watch("startTime");

  // Limpa os horários quando o turno muda
  useEffect(() => {
    if (selectedShift) {
      form.setValue("startTime", "");
      form.setValue("endTime", "");
    }
  }, [selectedShift, form]);

  // Máscara para valores monetários
  const applyMoneyMask = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    
    if (onlyNumbers === "") return "";
    
    // Adiciona zeros à esquerda se necessário
    const padded = onlyNumbers.padStart(3, "0");
    
    // Formata como 0,00
    const integerPart = padded.slice(0, -2) || "0";
    const decimalPart = padded.slice(-2);
    
    return `${integerPart},${decimalPart}`;
  };

  // Função para salvar rascunho
  const onSaveDraft = async () => {
    const formData = form.getValues();
    try {
      localStorage.setItem("contract-draft", JSON.stringify({
        ...formData,
        admissionDate: formData.admissionDate.toISOString(),
        contractDate: formData.contractDate.toISOString(),
        contractExpiration: formData.contractExpiration.toISOString(),
      }));
      
      toast.success("Rascunho salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho");
    }
  };

  // Função de submit
  const onSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Dados contratuais enviados:", data);

      // Aqui você pode adicionar a lógica de API
      // await api.post('/employees/contract', data);

      // Salva os dados antes de navegar
      localStorage.setItem("contract-data", JSON.stringify({
        ...data,
        admissionDate: data.admissionDate.toISOString(),
        contractDate: data.contractDate.toISOString(),
        contractExpiration: data.contractExpiration.toISOString(),
      }));

      // Navega para a próxima página
      router.push("/pessoal/cadastro/documentos");
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast.error("Erro ao enviar dados");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para próximo (com validação)
  const handleNextPage = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        // Se válido, submete o formulário
        form.handleSubmit(onSubmit)();
      } else {
        console.log("Formulário contém erros. Corrija antes de prosseguir.");
        toast.error("Por favor, corrija os erros antes de prosseguir.");

        // Scroll para o primeiro erro
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          const element = document.querySelector(`[name="${firstError}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  };

  // Função para anterior (sem validação)
  const handlePreviousPage = () => {
    // Salva o rascunho antes de navegar
    onSaveDraft();
    router.push("/pessoal/cadastro/contatos"); // Volta para página anterior
  };

  // Função para cancelar
  const handleCancel = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
      form.reset();
      localStorage.removeItem("contract-draft");
      toast.success("Dados limpos com sucesso!");
    }
  };

  // Carregar rascunho salvo
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem("contract-draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          form.reset({
            ...parsedDraft,
            admissionDate: new Date(parsedDraft.admissionDate),
            contractDate: new Date(parsedDraft.contractDate),
            contractExpiration: new Date(parsedDraft.contractExpiration),
          });
          console.log("Rascunho carregado");
        }
      } catch (error) {
        console.error("Erro ao carregar rascunho:", error);
      }
    };

    loadDraft();
  }, [form]);

  return (
    <PageLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <StepIndicator activeStep={4} />

          <fieldset className="space-y-8">
            <legend className="text-lg font-semibold mb-6 text-gray-800">
              Dados Contratuais
            </legend>

            {/* Linha 2 - Departamento e Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Financeiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 3 - Tipo de Contrato e Unidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Matriz Recife" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 4 - Turno e Horários */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Inicial *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedShift}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedShift
                                ? "Selecione..."
                                : "Selecione um turno"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedShift ? (
                            shiftHours[
                              selectedShift as keyof typeof shiftHours
                            ].map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="no-shift-selected">
                              Selecione um turno primeiro
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Final *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedStartTime}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedStartTime
                                ? "Selecione..."
                                : "Selecione um horário inicial"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedStartTime ? (
                            allHours
                              .filter((time) => {
                                const [currentHour] = time.value
                                  .split(":")
                                  .map(Number);
                                const [startHour] = selectedStartTime
                                  .split(":")
                                  .map(Number);
                                return currentHour > startHour;
                              })
                              .map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem disabled value="no-start-time-selected">
                              Selecione um horário inicial primeiro
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 5 - Salário, Admissão e Período de Experiência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="hourlyWage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Homem/Hora *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 00,00"
                        value={field.value}
                        onChange={(e) => {
                          const maskedValue = applyMoneyMask(e.target.value);
                          field.onChange(maskedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probationPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de Experiência *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 90 dias" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 6 - Superior e Hierarquia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="supervisor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Superior Direto *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisors.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hierarchyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grau Hierárquico *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {hierarchyLevels.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 7 - Datas do Contrato */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="contractDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Contrato *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração do Contrato *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12 meses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractExpiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento do Contrato *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 8 - Total de Dias */}
            <div className="w-full md:w-1/3">
              <FormField
                control={form.control}
                name="totalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Dias *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 365" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          <FormActionsButton
            onCancel={handleCancel}
            disabled={isSubmitting}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            previousLabel="Voltar"
            nextLabel={isSubmitting ? "Enviando..." : "Próximo"}
            cancelLabel="Limpar"
            onSaveDraft={onSaveDraft}
          />
        </form>
      </Form>
    </PageLayout>
  );
}
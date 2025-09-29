"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormActionsButton } from "@/components/ui/button/FormActionsButton";
import { TbPhotoUp } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const relationshipOptions = [
  { value: "filho", label: "Filho(a)" },
  { value: "conjuge", label: "Cônjuge" },
  { value: "pai", label: "Pai/Mãe" },
  { value: "outro", label: "Outro" },
];

// Schema com todos os campos opcionais
const formSchema = z.object({
  dependents: z.array(
    z.object({
      nome: z.string().optional(),
      parentesco: z.string().optional(),
      dataNascimento: z.date().optional(),
      documento: z.any().optional(),
      idade: z.number().optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

// Valores padrão - array vazio, sem dependentes
const defaultValues: FormData = {
  dependents: [],
};

export default function DependentsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dependents",
  });

  const calculateAge = (birthDate: Date) => {
    if (!birthDate) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Função para salvar rascunho
  const onSaveDraft = async () => {
    const formData = form.getValues();
    try {
      const serializableData = {
        ...formData,
        dependents: formData.dependents.map(dep => ({
          ...dep,
          dataNascimento: dep.dataNascimento ? dep.dataNascimento.toISOString() : null,
          documento: dep.documento instanceof File ? dep.documento.name : dep.documento
        }))
      };
      
      localStorage.setItem("dependents-draft", JSON.stringify(serializableData));
      toast.success("Rascunho salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho");
    }
  };

  // Função de submit - aceita array vazio
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log("Dados de dependentes enviados:", data);

      // Filtrar dependentes vazios (opcional)
      const filteredDependents = data.dependents.filter(dep => 
        dep.nome || dep.parentesco || dep.dataNascimento
      );

      // Aqui você pode adicionar a lógica de API
      // await api.post('/employees/dependents', { dependents: filteredDependents });

      // Salva os dados antes de navegar
      localStorage.setItem("dependents-data", JSON.stringify({
        dependents: filteredDependents.map(dep => ({
          ...dep,
          dataNascimento: dep.dataNascimento ? dep.dataNascimento.toISOString() : null,
          documento: dep.documento instanceof File ? dep.documento.name : dep.documento
        }))
      }));

      // Navega para a próxima página
      router.push("/pessoal/cadastro/informacoesPessoais");
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast.error("Erro ao enviar dados");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para próximo (com validação)
  const handleNextPage = () => {
    // Pode prosseguir mesmo sem dependentes
    form.handleSubmit(onSubmit)();
  };

  // Função para anterior
  const handlePreviousPage = () => {
    onSaveDraft();
    router.push("/pessoal/cadastro/documentos");
  };

  // Função para cancelar
  const handleCancel = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
      form.reset(defaultValues);
      localStorage.removeItem("dependents-draft");
      toast.success("Dados limpos com sucesso!");
    }
  };

  // Carregar rascunho salvo
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem("dependents-draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          const draftWithDates = {
            ...parsedDraft,
            dependents: parsedDraft.dependents.map((dep: FormData['dependents'][number]) => ({
              ...dep,
              dataNascimento: dep.dataNascimento ? new Date(dep.dataNascimento) : undefined,
              idade: dep.idade || (dep.dataNascimento ? calculateAge(new Date(dep.dataNascimento)) : 0)
            }))
          };
          form.reset(draftWithDates);
          console.log("Rascunho de dependentes carregado");
        }
      } catch (error) {
        console.error("Erro ao carregar rascunho:", error);
      }
    };

    loadDraft();
  }, [form]);

  // Adicionar um dependente vazio
  const addEmptyDependent = () => {
    append({
      nome: "",
      parentesco: "",
      dataNascimento: undefined,
      documento: undefined,
      idade: 0,
    });
  };

  return (
    <PageLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <StepIndicator activeStep={6} />

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Dependentes
              </h2>
              <p className="text-sm text-gray-500">
                {fields.length === 0 ? "Nenhum dependente adicionado" : `${fields.length} dependente(s)`}
              </p>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mb-6">
                <p className="text-gray-500 mb-4">Nenhum dependente cadastrado</p>
                <Button
                  type="button"
                  variant="outline"
                  size={"lg"}
                  onClick={addEmptyDependent}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Adicionar Dependente
                </Button>
              </div>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="mb-8 border border-gray-200 rounded-lg p-6 relative"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700">
                    Dependente {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.nome`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Nome</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo (opcional)" 
                            {...formField} 
                            value={formField.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`dependents.${index}.parentesco`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Parentesco
                        </FormLabel>
                        <Select
                          onValueChange={formField.onChange}
                          value={formField.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationshipOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.dataNascimento`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Data de Nascimento
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={formField.value || undefined}
                            onChange={(date) => {
                              formField.onChange(date);
                              if (date) {
                                const age = calculateAge(date);
                                form.setValue(
                                  `dependents.${index}.idade`,
                                  age
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <FormItem>
                      <FormLabel className="text-gray-700">Idade</FormLabel>
                      <div className="h-10 flex items-center text-gray-600">
                        {(() => {
                          const value = form.watch(`dependents.${index}.dataNascimento`);
                          let dateValue: Date | undefined;
                          if (value instanceof Date) {
                            dateValue = value;
                          } else if (typeof value === "string" && value) {
                            // Try to parse string to Date
                            const parsed = new Date(value);
                            dateValue = isNaN(parsed.getTime()) ? undefined : parsed;
                          } else {
                            dateValue = undefined;
                          }
                          return dateValue
                            ? calculateAge(dateValue) + " anos"
                            : "---";
                        })()}
                      </div>
                    </FormItem>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`dependents.${index}.documento`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Documento de Identificação (opcional)
                        </FormLabel>
                        <div className="relative w-full">
                          <TbPhotoUp
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B426E]"
                            size={18}
                          />
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              formField.onChange(file);
                            }}
                            className="bg-background pl-10 pr-4 file:bg-[#2B426E] file:text-white file:px-4 file:py-1 file:rounded-md file:border-none hover:file:bg-[#1f2f4f] file:cursor-pointer"
                          />
                          {formField.value instanceof File && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Selecionado: {formField.value.name}
                            </p>
                          )}
                          {typeof formField.value === 'string' && formField.value && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Arquivo salvo: {formField.value}
                            </p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            {fields.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEmptyDependent}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Adicionar outro Dependente
                </Button>
              </div>
            )}
          </div>

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
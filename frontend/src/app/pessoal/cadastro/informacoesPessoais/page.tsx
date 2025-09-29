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
import { StepIndicator } from "@/components/ui/step-indicator";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { DatePicker } from "@/components/ui/date-picker";
import { FormActionsButton } from "@/components/ui/button/FormActionsButton";
import { TbPhotoUp } from "react-icons/tb";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/confirmDialog";

// Schema corrigido para aceitar File ou undefined
const formSchema = z.object({
  certificados: z.array(
    z.object({
      nome: z.string().min(1, "O nome do certificado é obrigatório"),
      dataEmissao: z.date({
        required_error: "Data de emissão é obrigatória",
      }),
      dataValidade: z.date({
        required_error: "Data de validade é obrigatória",
      }),
      documento: z.any().optional(),
    })
  ),
  aso: z.object({
    nomeASO: z.string().min(1, "O nome é obrigatório"),
    dataEmissao: z.date({
      required_error: "Data de emissão é obrigatória",
    }),
    dataValidade: z.date({
      required_error: "Data de validade é obrigatória",
    }),
    documento: z.any().optional(),
  }),
  medidas: z.object({
    camisa: z.string().optional(),
    calca: z.string().optional(),
    calcado: z.string().optional(),
    peso: z.string().optional(),
    altura: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

// Valores padrão
const defaultValues: FormData = {
  certificados: [{
    nome: "",
    dataEmissao: new Date(),
    dataValidade: new Date(),
    documento: undefined,
  }],
  aso: {
    nomeASO: "",
    dataEmissao: new Date(),
    dataValidade: new Date(),
    documento: undefined,
  },
  medidas: {
    camisa: "",
    calca: "",
    calcado: "",
    peso: "",
    altura: "",
  },
};

export default function PersonalInfoStep() {
  const [diasASO, setDiasASO] = useState<number | null>(null);
  const [diasCertificados, setDiasCertificados] = useState<(number | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields: certificadosFields, append: appendCertificado, remove: removeCertificado } = useFieldArray({
    control: form.control,
    name: "certificados",
  });

  const calcularDiasRestantes = useCallback((dataValidade: Date | undefined) => {
    if (!dataValidade) return null;
    
    const hoje = new Date();
    const diffTime = Math.max(
      new Date(dataValidade).getTime() - hoje.getTime(),
      0
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Calcula dias restantes para ASO
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith("aso.dataValidade") ||
        name?.startsWith("aso.dataEmissao")
      ) {
        const dias = calcularDiasRestantes(value.aso?.dataValidade);
        setDiasASO(dias);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calcularDiasRestantes]);

  // Calcula dias restantes para todos os certificados
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("certificados")) {
        const dias = value.certificados?.map(certificado => 
          calcularDiasRestantes(certificado?.dataValidade)
        ) || [];
        setDiasCertificados(dias);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calcularDiasRestantes]);

  // Função para salvar rascunho
  const onSaveDraft = async () => {
    const formData = form.getValues();
    try {
      const serializableData = {
        ...formData,
        certificados: formData.certificados.map(cert => ({
          ...cert,
          dataEmissao: cert.dataEmissao.toISOString(),
          dataValidade: cert.dataValidade.toISOString(),
          documento: cert.documento instanceof File ? cert.documento.name : cert.documento
        })),
        aso: {
          ...formData.aso,
          dataEmissao: formData.aso.dataEmissao.toISOString(),
          dataValidade: formData.aso.dataValidade.toISOString(),
          documento: formData.aso.documento instanceof File ? formData.aso.documento.name : formData.aso.documento
        }
      };
      
      localStorage.setItem("personal-info-draft", JSON.stringify(serializableData));
      toast.success("Rascunho salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho");
    }
  };

  // Função para coletar todos os dados das páginas anteriores
  const coletarTodosOsDados = () => {
    try {
      // Coletar dados de todas as páginas anteriores
      const dadosPessoais = localStorage.getItem("personal-data");
      const dadosContato = localStorage.getItem("contact-data"); 
      const dadosContratuais = localStorage.getItem("contract-data");
      const documentos = localStorage.getItem("documents-data");
      const dependentes = localStorage.getItem("dependents-data");
      const informacoesPessoais = form.getValues();

      return {
        dadosPessoais: dadosPessoais ? JSON.parse(dadosPessoais) : null,
        dadosContato: dadosContato ? JSON.parse(dadosContato) : null,
        dadosContratuais: dadosContratuais ? JSON.parse(dadosContratuais) : null,
        documentos: documentos ? JSON.parse(documentos) : null,
        dependentes: dependentes ? JSON.parse(dependentes) : null,
        informacoesPessoais: {
          ...informacoesPessoais,
          certificados: informacoesPessoais.certificados.map(cert => ({
            ...cert,
            dataEmissao: cert.dataEmissao.toISOString(),
            dataValidade: cert.dataValidade.toISOString(),
            documento: cert.documento instanceof File ? cert.documento.name : cert.documento
          })),
          aso: {
            ...informacoesPessoais.aso,
            dataEmissao: informacoesPessoais.aso.dataEmissao.toISOString(),
            dataValidade: informacoesPessoais.aso.dataValidade.toISOString(),
            documento: informacoesPessoais.aso.documento instanceof File ? informacoesPessoais.aso.documento.name : informacoesPessoais.aso.documento
          }
        }
      };
    } catch (error) {
      console.error("Erro ao coletar dados:", error);
      return null;
    }
  };

  // Função de submit FINAL - envia todos os dados
  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log("Enviando todos os dados do formulário...");

      // Coletar todos os dados
      const todosOsDados = coletarTodosOsDados();
      
      if (!todosOsDados) {
        throw new Error("Erro ao coletar dados das páginas anteriores");
      }

      console.log("Dados completos para envio:", todosOsDados);

      // AQUI VOCÊ FAZ O ENVIO PARA A API
      // Exemplo:
      // const response = await fetch('/api/employees', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(todosOsDados),
      // });

      // if (!response.ok) {
      //   throw new Error('Erro ao enviar dados');
      // }

      // Simulando o envio (remova isso quando implementar a API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Limpar todos os dados do localStorage após envio bem-sucedido
      localStorage.removeItem("personal-data");
      localStorage.removeItem("contact-data");
      localStorage.removeItem("contract-data");
      localStorage.removeItem("documents-data");
      localStorage.removeItem("dependents-data");
      localStorage.removeItem("personal-info-draft");

      toast.success("Cadastro realizado com sucesso!");
      
      // Redirecionar para página de confirmação ou dashboard
      router.push("/bemVindo");

    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast.error("Erro ao enviar dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };

  // Função para abrir o diálogo de confirmação
  const handleSubmitDialog = () => {
    setIsDialogOpen(true);
  };

  // Função para próximo (envio final)
  const handleNextPage = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        handleSubmitDialog();
      } else {
        console.log("Formulário contém erros. Corrija antes de enviar.");
        toast.error("Por favor, corrija os erros antes de enviar.");

        // Scroll para o primeiro erro
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          const element = document.querySelector(`[name="${firstError}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  };

  // Função para anterior
  const handlePreviousPage = () => {
    onSaveDraft();
    router.push("/pessoal/cadastro/dependentes");
  };

  // Função para cancelar
  const handleCancel = () => {
    if (confirm("Tem certeza que deseja cancelar o cadastro? Todos os dados serão perdidos.")) {
      // Limpar todos os dados
      form.reset(defaultValues);
      localStorage.removeItem("personal-data");
      localStorage.removeItem("contact-data");
      localStorage.removeItem("contract-data");
      localStorage.removeItem("documents-data");
      localStorage.removeItem("dependents-data");
      localStorage.removeItem("personal-info-draft");
      
      toast.success("Cadastro cancelado e dados limpos!");
      router.push("/pessoal");
    }
  };

  // Carregar rascunho salvo
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem("personal-info-draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          const draftWithDates = {
            ...parsedDraft,
            certificados: parsedDraft.certificados.map((cert: FormData["certificados"][number]) => ({
              ...cert,
              dataEmissao: new Date(cert.dataEmissao),
              dataValidade: new Date(cert.dataValidade)
            })),
            aso: {
              ...parsedDraft.aso,
              dataEmissao: new Date(parsedDraft.aso.dataEmissao),
              dataValidade: new Date(parsedDraft.aso.dataValidade)
            }
          };
          form.reset(draftWithDates);
          console.log("Rascunho de informações pessoais carregado");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <StepIndicator activeStep={7} />

          <div className="bg-white p-6 rounded-lg shadow-sm space-y-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Informações Pessoais
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Última etapa - Revise e envie seus dados
              </p>
            </div>

            {/* Certificados */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Certificados</h3>
              
              {certificadosFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Certificado {index + 1}</h4>
                    {certificadosFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertificado(index)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`certificados.${index}.nome`}
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Nome do Certificado*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome do certificado"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <FormField
                      control={form.control}
                      name={`certificados.${index}.dataEmissao`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Emissão*</FormLabel>
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
                      name={`certificados.${index}.dataValidade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Validade*</FormLabel>
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
                    <FormItem>
                      <FormLabel>Expira em Dias</FormLabel>
                      <div className="h-10 flex items-center border rounded-md px-3 bg-muted">
                        {diasCertificados[index] !== undefined && diasCertificados[index] !== null
                          ? `${diasCertificados[index]} Dias`
                          : "---"}
                      </div>
                    </FormItem>
                  </div>

                  <FormField
                    control={form.control}
                    name={`certificados.${index}.documento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anexar Documento</FormLabel>
                        <div className="relative w-full">
                          <TbPhotoUp
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B426E]"
                            size={18}
                          />
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            className="bg-background pl-10 pr-4 file:bg-[#2B426E] file:text-white file:px-4 file:py-1 file:rounded-md file:border-none hover:file:bg-[#1f2f4f] file:cursor-pointer"
                          />
                          {field.value instanceof File && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Selecionado: {field.value.name}
                            </p>
                          )}
                          {typeof field.value === 'string' && field.value && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Arquivo salvo: {field.value}
                            </p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => appendCertificado({
                  nome: "",
                  dataEmissao: new Date(),
                  dataValidade: new Date(),
                  documento: undefined,
                })}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Adicionar Certificado
              </Button>
            </div>

            {/* ASO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                ASO (Atestado de Saúde Ocupacional)
              </h3>

              <FormField
                control={form.control}
                name="aso.nomeASO"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do ASO*</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do ASO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="aso.dataEmissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Emissão*</FormLabel>
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
                  name="aso.dataValidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Validade*</FormLabel>
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
                <FormItem>
                  <FormLabel>Expira em Dias</FormLabel>
                  <div className="h-10 flex items-center border rounded-md px-3 bg-muted">
                    {diasASO !== null ? `${diasASO} Dias` : "---"}
                  </div>
                </FormItem>
              </div>

              <FormField
                control={form.control}
                name="aso.documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anexar Documento</FormLabel>
                    <div className="relative w-full">
                      <TbPhotoUp
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B426E]"
                        size={18}
                      />
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                        className="bg-background pl-10 pr-4 file:bg-[#2B426E] file:text-white file:px-4 file:py-1 file:rounded-md file:border-none hover:file:bg-[#1f2f4f] file:cursor-pointer"
                      />
                      {field.value instanceof File && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selecionado: {field.value.name}
                        </p>
                      )}
                      {typeof field.value === 'string' && field.value && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Arquivo salvo: {field.value}
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Medidas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Tamanho</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="medidas.camisa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Camisa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: M" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medidas.calca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calça</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 38" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medidas.calcado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calçado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 41" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medidas.peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 80kg" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medidas.altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1.72m" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <FormActionsButton
            onCancel={handleCancel}
            disabled={isSubmitting}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            previousLabel="Voltar"
            nextLabel={isSubmitting ? "Enviando..." : "Finalizar"}
            cancelLabel="Cancelar"
            onSaveDraft={onSaveDraft}
          />

          <ConfirmDialog
            isOpen={isDialogOpen}
            onConfirm={onSubmit}
            onCancel={() => setIsDialogOpen(false)}
            onClose={() => setIsDialogOpen(false)}
            confirmButtonLabel="Confirmar"
            title="Confirmação de Envio"
            message="Tem certeza de que deseja enviar o formulário? Após o envio, não será possível alterar as respostas."
            icon={<TbPhotoUp className="h-6 w-6 text-[#2B426E]" />}
          />
        </form>
      </Form>
    </PageLayout>
  );
}
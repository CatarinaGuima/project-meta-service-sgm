"use client";

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
import { Input } from "@/components/ui/input";
import { StepIndicator } from "@/components/ui/step-indicator";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { FormActionsButton } from "@/components/ui/button/FormActionsButton";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Schema de validação simplificado e robusto
const documentsSchema = z.object({
  estrangeiro: z.boolean(),
  rg: z.string().min(1, "RG é obrigatório").optional(),
  tituloEleitor: z.string().min(1, "Título de eleitor é obrigatório").optional(),
  banco: z.string().optional(),
  orgaoExpedidor: z.string().optional(),
  zonaEleitoral: z.string().optional(),
  agencia: z.string().optional(),
  dataExpedicao: z.string().optional(),
  secaoEleitoral: z.string().optional(),
  contaCorrente: z.string().optional(),
});

// Tipo com valores padrão explícitos
type DocumentsFormData = {
  estrangeiro: boolean;
  rg?: string;
  tituloEleitor?: string;
  banco?: string;
  orgaoExpedidor?: string;
  zonaEleitoral?: string;
  agencia?: string;
  dataExpedicao?: string;
  secaoEleitoral?: string;
  contaCorrente?: string;
};

export default function DocumentsRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Valores padrão explícitos
  const defaultValues: DocumentsFormData = useMemo(() => ({
    estrangeiro: false,
    rg: "",
    tituloEleitor: "",
    banco: "",
    orgaoExpedidor: "",
    zonaEleitoral: "",
    agencia: "",
    dataExpedicao: "",
    secaoEleitoral: "",
    contaCorrente: "",
  }), []);

  const form = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues,
  });

  const isEstrangeiro = form.watch("estrangeiro");

  // Função para salvar rascunho
  const onSaveDraft = async () => {
    const formData = form.getValues();
    try {
      localStorage.setItem("documents-draft", JSON.stringify(formData));
      toast.success("Rascunho salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho");
    }
  };

  // Função de submit
  const onSubmit = async (data: DocumentsFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Dados de documentos enviados:", data);

      // Validação condicional manual
      if (!data.estrangeiro) {
        if (!data.rg || data.rg.trim().length === 0) {
          form.setError("rg", { message: "RG é obrigatório para brasileiros" });
          setIsSubmitting(false);
          return;
        }
        if (!data.tituloEleitor || data.tituloEleitor.trim().length === 0) {
          form.setError("tituloEleitor", { message: "Título de eleitor é obrigatório para brasileiros" });
          setIsSubmitting(false);
          return;
        }
      }

      // Aqui você pode adicionar a lógica de API
      // await api.post('/employees/documents', data);

      // Salva os dados antes de navegar
      localStorage.setItem("documents-data", JSON.stringify(data));

      // Navega para a próxima página (ajuste conforme sua rota)
      router.push("/pessoal/cadastro/dependentes");
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
    router.push("/pessoal/cadastro/dadosContratuais"); // Volta para página anterior
  };

  // Função para cancelar
  const handleCancel = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
      form.reset(defaultValues);
      localStorage.removeItem("documents-draft");
      toast.success("Dados limpos com sucesso!");
    }
  };

  // Carregar rascunho salvo
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem("documents-draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          form.reset({
            ...defaultValues,
            ...parsedDraft,
          });
          console.log("Rascunho de documentos carregado");
        }
      } catch (error) {
        console.error("Erro ao carregar rascunho:", error);
      }
    };

    loadDraft();
  }, [form, defaultValues]);

  return (
    <PageLayout>
      <StepIndicator activeStep={5} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <h2 className="text-lg font-semibold">Documentos</h2>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Seção Estrangeiro */}
          <div className="space-y-4">
            <h3 className="font-medium">Estrangeiro</h3>
            <FormField
              control={form.control}
              name="estrangeiro"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      É estrangeiro?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Linha 1 - RG e Título de Eleitor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG {!isEstrangeiro && "*"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 11222333"
                        {...field}
                        disabled={isEstrangeiro}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tituloEleitor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título de Eleitor {!isEstrangeiro && "*"}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1234567891234" 
                        {...field}
                        disabled={isEstrangeiro}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2 - Banco e Órgão Expedidor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="banco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Banco do Brasil" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orgaoExpedidor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão expedidor</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: SDS/PE" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 3 - Zona Eleitoral e Agência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zonaEleitoral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Eleitoral</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1ª Zona Eleitoral" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1234-5" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 4 - Data de Expedição e Seção Eleitoral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataExpedicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Expedição</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 12/07/2022" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secaoEleitoral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seção Eleitoral</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 0012" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 5 - Conta Corrente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contaCorrente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Corrente</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 12345-6" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
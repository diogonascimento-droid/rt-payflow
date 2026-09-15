export function SemPermissao() {
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-7">
      <div className="max-w-[420px] text-center flex flex-col items-center gap-3.5">
        <div className="w-10 h-[3px] bg-lima-ui rounded-[2px]" />
        <h2 className="font-heading text-[20px] font-bold m-0">Você não tem permissão para editar</h2>
        <p className="m-0 text-[14px] leading-relaxed text-text-muted">
          Seu acesso ao RT PayFlow é somente para visualização. Fale com um dos editores se precisar lançar ou importar dados.
        </p>
      </div>
    </div>
  );
}

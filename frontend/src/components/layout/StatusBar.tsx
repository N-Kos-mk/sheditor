interface Props { loading?: boolean }

export const StatusBar = ({ loading = false }: Props) => (
  <div className="shrink-0 relative overflow-hidden" style={{ height: 2 }}>
    {loading ? (
      <>
        <div className="absolute inset-0 bg-indigo-100" />
        <div
          className="absolute inset-y-0 w-2/5 status-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #6366f1 40%, #a5b4fc 60%, transparent 100%)' }}
        />
      </>
    ) : (
      <div className="absolute inset-0 bg-zinc-200" />
    )}
  </div>
)

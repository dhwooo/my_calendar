// template.tsx re-renders on each navigation, so child trees re-mount
// and animations replay — perfect for page-to-page transitions.

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-fade-in">{children}</div>;
}

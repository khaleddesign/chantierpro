export default function UserAvatar({ user, size = "md" }: { 
  user: { id: string; name: string; role?: string }; 
  size?: "sm" | "md" | "lg" 
}) {
  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0,2);
  return (
    <div style={{
      width: size === "sm" ? "24px" : size === "lg" ? "48px" : "32px",
      height: size === "sm" ? "24px" : size === "lg" ? "48px" : "32px", 
      borderRadius: "50%",
      background: "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center", 
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: "600"
    }}>
      {getInitials(user.name)}
    </div>
  );
}

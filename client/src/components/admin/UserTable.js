import React from "react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { formatDate } from "../../utils/formatters";

const UserTable = ({ users = [], onToggle }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%",borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ borderBottom:"1px solid var(--clr-border)" }}>
          {["Name","Email","Role","Status","Joined","Action"].map((h) => (
            <th key={h} style={{ textAlign:"left",padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,color:"var(--clr-text-3)",textTransform:"uppercase",letterSpacing:"0.06em" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id} style={{ borderBottom:"1px solid var(--clr-border)" }}>
            <td style={{ padding:"10px 12px",fontWeight:600,fontSize:"0.88rem" }}>{u.name}</td>
            <td style={{ padding:"10px 12px",color:"var(--clr-text-2)",fontSize:"0.85rem" }}>{u.email}</td>
            <td style={{ padding:"10px 12px" }}><Badge variant={u.role==="admin"?"warning":u.role==="company"?"primary":"default"}>{u.role}</Badge></td>
            <td style={{ padding:"10px 12px" }}><Badge variant={u.isActive?"success":"danger"}>{u.isActive?"Active":"Inactive"}</Badge></td>
            <td style={{ padding:"10px 12px",color:"var(--clr-text-3)",fontSize:"0.8rem" }}>{formatDate(u.createdAt)}</td>
            <td style={{ padding:"10px 12px" }}><Button variant="ghost" size="sm" onClick={() => onToggle(u._id)}>{u.isActive?"Deactivate":"Activate"}</Button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UserTable;

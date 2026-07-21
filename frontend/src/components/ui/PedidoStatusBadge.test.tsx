import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PedidoStatusBadge } from "./PedidoStatusBadge";

describe("PedidoStatusBadge", () => {
  it("mostra o texto do status, não o enum técnico", () => {
    render(<PedidoStatusBadge status="EM_PREPARO" />);

    expect(screen.getByText("Em preparo")).toBeInTheDocument();
    expect(screen.queryByText("EM_PREPARO")).not.toBeInTheDocument();
  });
});

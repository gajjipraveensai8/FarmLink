import { fireEvent, render, screen } from "@testing-library/react";
import ProductCard from "../ProductCard";

vi.mock("react-hot-toast", () => ({
  toast: vi.fn(),
}));

const baseProduct = {
  _id: "p1",
  name: "Farm Eggs",
  price: 120,
  quantity: 5,
  category: "eggs",
  farmer: { name: "Green Farm" },
  harvestDate: new Date().toISOString(),
};

describe("ProductCard", () => {
  it("shows freshness text and calls add to cart for buyers", () => {
    const onAddToCart = vi.fn();

    render(
      <ProductCard
        product={baseProduct}
        onAddToCart={onAddToCart}
        isBuyer
      />
    );

    expect(screen.getByText(/harvested today/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add farm eggs to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith(baseProduct, 1);
  });

  it("shows login CTA for guest users", () => {
    const onAddToCart = vi.fn();

    render(
      <ProductCard
        product={baseProduct}
        onAddToCart={onAddToCart}
        isBuyer={false}
      />
    );

    expect(screen.getByRole("button", { name: /login to add to cart/i })).toBeInTheDocument();
  });
});

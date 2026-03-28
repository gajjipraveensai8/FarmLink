import { fireEvent, render, screen } from "@testing-library/react";
import MarketplaceSearch from "../MarketplaceSearch";

describe("MarketplaceSearch", () => {
  it("submits current query and radius", () => {
    const onSearch = vi.fn();
    const onUseLocation = vi.fn();

    render(
      <MarketplaceSearch
        onSearch={onSearch}
        onUseLocation={onUseLocation}
        geoLoading={false}
        initialQuery="tomato"
        initialRadius="10"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/search fresh vegetables/i), {
      target: { value: "organic milk" },
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "30" },
    });

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith("organic milk", "30");
  });

  it("calls location handler", () => {
    const onSearch = vi.fn();
    const onUseLocation = vi.fn();

    render(
      <MarketplaceSearch
        onSearch={onSearch}
        onUseLocation={onUseLocation}
        geoLoading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(onUseLocation).toHaveBeenCalledTimes(1);
  });
});

import { useNavigate } from "react-router-dom";
import { UserProfilePage } from "../components/auth/UserProfilePage";
import { CartItem, Product } from "../types";

interface ProfilePageProps {
  cart: CartItem[];
  onRemoveFromCart: (id: number) => void;
  onChangeQty: (id: number, delta: number) => void;
  wishlist: Set<number>;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (product: Product) => void;
}

export function ProfilePage(props: ProfilePageProps) {
  const navigate = useNavigate();

  return (
    <UserProfilePage
      {...props}
      onClose={() => navigate("/")}
    />
  );
}

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Order placement and cancellation run in database functions (place_order, cancel_order) so stock checks/decrements are atomic and cannot be bypassed from the browser.
- Guest cart lives in localStorage and merges into the cart_items table on sign-in; signed-in cart writes go straight to the table.
- Admin access uses user_roles (owner/staff) via has_role/is_admin; never store roles on profiles.
- New page metadata uses pageHead with a page-specific title and description; private pages are noindex to avoid exposing account and store-management pages in search results.

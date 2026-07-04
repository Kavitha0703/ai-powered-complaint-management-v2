awk '/^        <\/div>$/ {
    getline next_line
    if (next_line ~ /Action Controls/) {
        print next_line
        next
    } else {
        print
        print next_line
        next
    }
}
{ print }' src/components/DcmsCamera.tsx > temp.tsx && mv temp.tsx src/components/DcmsCamera.tsx

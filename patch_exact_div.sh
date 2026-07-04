sed -i '/^        <\/div>$/ {
N
/        {[/]\* Action Controls/ {
s/^        <\/div>\n//
}
}' src/components/DcmsCamera.tsx

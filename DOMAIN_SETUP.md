# Domain Setup for math.inquiry.institute

## ✅ Completed Steps

1. **CNAME file created** in repository root
2. **Route 53 DNS record created** - CNAME pointing to `inquiryinstitute.github.io`

## Next Steps

### 1. Enable GitHub Pages

1. Go to: **https://github.com/InquiryInstitute/math/settings/pages**

2. Under **"Source"**:
   - Select: **"Deploy from a branch"**
   - Branch: **`main`**
   - Folder: **`/ (root)`**
   - Click **Save**

### 2. Configure Custom Domain

1. Still in Pages settings, scroll to **"Custom domain"**
2. Enter: `math.inquiry.institute`
3. ✅ Check **"Enforce HTTPS"**
4. Click **Save**

### 3. Wait for Verification

GitHub will:
- ✅ Verify DNS records (checks Route 53 CNAME)
- ✅ Provision SSL certificate (via Let's Encrypt)
- ✅ Update site URL

**Verification time:** Usually 5-10 minutes

## DNS Configuration

**Route 53 CNAME Record:**
```
math.inquiry.institute  CNAME  inquiryinstitute.github.io  TTL: 300
```

**Status:** ✅ Created and propagating

## Verification

Once GitHub verifies the domain:

1. ✅ Visit: **https://math.inquiry.institute**
2. ✅ Check SSL certificate (green padlock)
3. ✅ Verify all assets load correctly

## Troubleshooting

### DNS Not Resolving

Check DNS propagation:
```bash
dig math.inquiry.institute
nslookup math.inquiry.institute
```

Or use online tools:
- https://dnschecker.org/#CNAME/math.inquiry.institute
- https://www.whatsmydns.net/#CNAME/math.inquiry.institute

### GitHub Pages Custom Domain Not Verifying

1. Ensure DNS has fully propagated (wait 5-10 minutes)
2. Check that CNAME record is visible:
   ```bash
   dig math.inquiry.institute CNAME
   ```
3. Verify CNAME points to `inquiryinstitute.github.io`
4. Check GitHub Pages settings for error messages

### SSL Certificate Not Provisioning

- Wait 5-10 minutes after domain verification
- Ensure "Enforce HTTPS" is enabled in GitHub Pages settings
- Check certificate status in Pages settings

## Current Status

- ✅ CNAME file: Created
- ✅ Route 53 DNS: Created
- ⏳ GitHub Pages: Needs to be enabled
- ⏳ Custom domain: Needs to be configured in GitHub
- ⏳ SSL certificate: Will be provisioned automatically

---

**Quick Links:**
- Pages Settings: https://github.com/InquiryInstitute/math/settings/pages
- Repository: https://github.com/InquiryInstitute/math

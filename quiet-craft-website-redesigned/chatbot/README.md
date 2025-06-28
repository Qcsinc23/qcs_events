# AI Chatbot Integration - Setup Guide

## Overview
This chatbot system integrates OpenAI's GPT models with a customizable knowledge base to provide intelligent customer support for Quiet Craft Solutions Inc. The system includes an admin interface for configuration and a floating widget that appears on your website.

## Features
- 🤖 **OpenAI Integration**: Uses GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, O1 Preview, or O1 Mini models
- 📚 **Knowledge Base**: Upload company documents (PDF, TXT, DOC, DOCX, MD)
- 🎨 **Professional UI**: Floating chat widget with modern design
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🔒 **Secure**: API keys stored locally, never transmitted
- ⚡ **Real-time**: Instant responses with typing indicators
- 🎯 **Context-Aware**: Uses knowledge base for accurate company information

## Quick Start

### 1. Get OpenAI API Key
1. Visit [OpenAI API Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-...`)

### 2. Configure the Chatbot
1. Navigate to `/chatbot/index.html` in your browser
2. Enter your OpenAI API key
3. Select your preferred model (GPT-4 recommended)
4. Customize company name and bot personality
5. Click "Save Configuration"

### 3. Add Knowledge Base (Optional)
1. Upload company documents using the file uploader
2. Supported formats: PDF, TXT, DOC, DOCX, MD
3. Files are processed and stored locally
4. The chatbot will use this information to answer questions

### 4. Test the Chatbot
1. Click "Test Chatbot" to verify everything works
2. Visit your main website to see the floating chat button
3. Click the chat button to start a conversation

## Admin Interface Features

### Configuration Panel
- **API Key Management**: Secure storage of OpenAI credentials
- **Model Selection**: Choose from available OpenAI models
- **Company Branding**: Customize company name and bot personality
- **Response Testing**: Test API connectivity and responses

### Knowledge Base Management
- **File Upload**: Drag-and-drop or click to upload documents
- **File Processing**: Automatic text extraction and storage
- **Content Management**: View and remove uploaded files
- **Storage Tracking**: Monitor file sizes and upload dates

## Models Available

### GPT-4 (Recommended)
- **Best for**: Complex reasoning and detailed responses
- **Cost**: Higher cost per token
- **Use case**: Professional customer service

### GPT-4 Turbo
- **Best for**: Faster responses while maintaining quality
- **Cost**: Moderate cost per token
- **Use case**: High-volume customer interactions

### GPT-3.5 Turbo
- **Best for**: Quick responses and basic questions
- **Cost**: Lower cost per token
- **Use case**: Simple FAQ and basic support

### O1 Preview/Mini
- **Best for**: Advanced reasoning tasks
- **Cost**: Varies
- **Use case**: Complex logistics planning questions

## Customization Options

### Bot Personality
The bot personality should reflect your company's voice:

```
Example: "Professional and helpful logistics expert specializing in event coordination. 
Provide accurate information about our services, pricing, and capabilities. 
Always maintain a professional tone while being friendly and solution-oriented."
```

### Company Information
Update the default company information in the configuration:
- Company name
- Contact information
- Service areas
- Specializations

### Visual Styling
The chatbot automatically matches your website's professional theme with:
- Blue color scheme matching your brand
- Clean, modern typography
- Responsive design
- Professional animations

## Knowledge Base Best Practices

### Document Types to Upload
1. **Service Descriptions**: Detailed information about logistics services
2. **Pricing Guidelines**: General pricing structure and policies
3. **FAQ Documents**: Common questions and answers
4. **Company Policies**: Terms of service, shipping policies
5. **Geographic Coverage**: Service areas and limitations

### Sample Documents Included
- `knowledge-base-sample.md`: Comprehensive company information template
- Upload this file to get started with a professional knowledge base

### Content Guidelines
- Use clear, professional language
- Include specific details about services
- Add contact information and emergency numbers
- Update regularly with new policies or services

## Troubleshooting

### Common Issues

#### "API Key Required" Error
- Ensure you've entered a valid OpenAI API key
- Check that the key starts with `sk-`
- Verify your OpenAI account has available credits

#### "$0.00" Calculator Still Shows
- The chatbot is separate from the pricing calculator
- Update the calculator separately if needed
- Chatbot can provide general pricing guidance

#### Chatbot Not Appearing
- Check browser console for JavaScript errors
- Ensure the chatbot script is loaded
- Verify the widget isn't blocked by ad blockers

#### Poor Response Quality
- Add more detailed information to knowledge base
- Adjust bot personality for better responses
- Consider upgrading to GPT-4 for better quality

### Support Contacts
- **Technical Issues**: Check browser console for errors
- **OpenAI API Issues**: Contact OpenAI support
- **General Questions**: Use the test chatbot feature

## Security Considerations

### Data Storage
- API keys stored in browser localStorage only
- Knowledge base files stored locally
- No data transmitted to external servers except OpenAI API

### API Key Security
- Never share your API key publicly
- Rotate keys regularly for security
- Monitor OpenAI usage dashboard for unexpected activity

### Production Deployment
For production use, consider:
- Implementing server-side API proxy
- Adding rate limiting
- Monitoring usage and costs
- Regular security audits

## Cost Management

### Token Usage
- Each message consumes tokens (input + output)
- Longer conversations cost more
- Knowledge base context adds to token count

### Cost Optimization Tips
1. Use GPT-3.5 Turbo for simple questions
2. Limit knowledge base size
3. Keep conversations focused
4. Monitor usage in OpenAI dashboard

### Budget Controls
- Set up billing alerts in OpenAI account
- Monitor daily/monthly usage
- Consider implementing usage limits

## Advanced Features

### Custom Responses
The chatbot includes fallback responses for common scenarios:
- Quote requests → Directs to quote form
- Service questions → Lists available services
- Emergency requests → Provides immediate contact info

### Integration Options
- Can be integrated with existing CRM systems
- Supports webhook notifications
- Compatible with analytics tracking

## Updates and Maintenance

### Regular Tasks
1. **Update Knowledge Base**: Add new company information
2. **Monitor Costs**: Check OpenAI usage monthly
3. **Test Functionality**: Verify chatbot responses regularly
4. **Update API Keys**: Rotate keys for security

### Version Updates
The chatbot system is designed to be self-contained and easy to update. Future enhancements may include:
- Advanced analytics
- Multi-language support
- Integration with business systems
- Enhanced knowledge base search

## Support

For technical support or feature requests:
1. Test the configuration using the admin interface
2. Check the browser console for error messages
3. Verify OpenAI API key permissions and credits
4. Review the knowledge base content for accuracy

The chatbot is designed to provide immediate value while being easy to configure and maintain. Start with the basic setup and gradually enhance the knowledge base for better responses.
# Kostman - API Testing Tool

A modern, web-based API testing tool built with Laravel 12 and React 19, designed to be a powerful alternative to Postman with a focus on developer experience and performance.

## 🚀 Features

- **Modern UI**: Built with React 19, shadcn/ui, and Tailwind CSS
- **Request Builder**: Support for all HTTP methods with advanced request configuration
- **Collections Management**: Organize requests in collections and folders
- **Environment Variables**: Manage different environments (dev, staging, production)
- **Request History**: Track and replay previous requests
- **Authentication**: Secure user management with Laravel Sanctum
- **Real-time Updates**: Live request/response handling
- **Export/Import**: Compatible with Postman collections

## 🛠️ Technology Stack

### Backend
- **Laravel 12** - PHP framework
- **MySQL** - Database
- **Laravel Sanctum** - API authentication

### Frontend
- **React 19** - UI library
- **Inertia.js v2** - Full-stack framework
- **shadcn/ui** - Component library
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool

## 📋 Requirements

- PHP 8.4+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm/yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/kostman.git
cd kostman
```

### 2. Install PHP dependencies
```bash
composer install
```

### 3. Install Node.js dependencies
```bash
npm install
```

### 4. Environment setup
```bash
cp .env.example .env
php artisan key:generate
```

### 5. Configure database
Update your `.env` file with database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kostman
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 6. Run migrations
```bash
php artisan migrate
```

### 7. Start development servers
```bash
composer run dev
```

This will start:
- PHP server on `http://localhost:8000`
- Vite dev server on `http://localhost:5174`
- Queue worker for background jobs

## 🏗️ Project Structure

```
kostman/
├── app/                    # Laravel application code
│   ├── Http/Controllers/   # API controllers
│   ├── Models/            # Eloquent models
│   └── Policies/          # Authorization policies
├── database/              # Database migrations and seeders
├── resources/
│   ├── js/               # React frontend code
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # Layout components
│   │   └── pages/        # Page components
│   └── views/            # Blade templates
├── routes/               # Route definitions
└── tests/               # PHPUnit tests
```

## 🧪 Testing

Run the test suite:
```bash
php artisan test
```

Run specific tests:
```bash
php artisan test --filter=CollectionTest
```

## 🔧 Development

### Code Standards
The project uses Laravel Pint for PHP code formatting:
```bash
vendor/bin/pint
```

### Database
- **MySQL** database with migrations
- **Seeders** for sample data
- **Factories** for testing

### Frontend Development
- Hot module replacement with Vite
- TypeScript support
- Component-based architecture with shadcn/ui

## 📚 Documentation

- [Application Instructions](.github/application-instructions.md) - Detailed feature specifications
- [Development Guidelines](.github/copilot-instructions.md) - Coding standards and best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Laravel framework and community
- React and the React ecosystem
- shadcn/ui for the beautiful components
- All contributors who help make this project better

## 📞 Support

If you have any questions or issues, please:
- Open an issue on GitHub
- Check the documentation in the `.github` folder
- Review existing issues and discussions

---

Built with ❤️ using Laravel 12, React 19, and modern web technologies.
